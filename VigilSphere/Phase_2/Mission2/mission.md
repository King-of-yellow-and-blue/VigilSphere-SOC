# MISSION: Python Log Simulator & Threat Detector

## ROLE
You are building this project from scratch inside this IDE. Treat every
section below as a requirement, not a suggestion. Work through the
**EXECUTION STEPS** in order, and before finishing, walk through the
**ACCEPTANCE CHECKLIST** at the bottom and confirm each line item against
the code you actually wrote.

## OBJECTIVE
Build a Python script that simulates realistic server traffic — plus a
periodic brute-force attack pattern — by generating fake log strings and
writing them directly into a Supabase table. This is a synthetic-data
generator for testing detection rules, dashboards, and alerting logic. It
must not open any network port, run a web server, or contact any real host —
it only fabricates log strings and writes them to the user's own Supabase
project via the Supabase API.

## TECH STACK
- Python 3.10+
- `faker` — realistic fake log field generation (IPs, usernames, user agents, URI paths)
- `supabase-py` (the `supabase` package) — Supabase client
- `python-dotenv` — load credentials from a local `.env` file (optional but include it)

## FILE STRUCTURE TO CREATE
```
requirements.txt
log_engine.py
.env.example
schema.sql
README.md          (short usage summary; can be brief, Mission.md has the detail)
```

## STEP-BY-STEP BUILD INSTRUCTIONS

### 1. `requirements.txt`
Pin minimum versions:
```
faker>=24.0.0
supabase>=2.4.0
python-dotenv>=1.0.0
```

### 2. `schema.sql`
Write the SQL that creates the target table in Supabase, so the schema is
explicit and reproducible rather than relying on auto-created columns:
```sql
create table if not exists security_logs (
    id          uuid primary key,
    timestamp   timestamptz not null default now(),
    source_ip   text not null,
    log_type    text not null check (log_type in ('ssh', 'nginx')),
    message     text not null,
    is_anomaly  boolean not null default false,
    mitre_tag   text
);

create index if not exists idx_security_logs_is_anomaly on security_logs (is_anomaly);
create index if not exists idx_security_logs_timestamp on security_logs (timestamp);
```

### 3. `.env.example`
Placeholder credentials the user pastes real values into. **Never** hardcode
real keys anywhere in the code.
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-supabase-service-or-anon-key
SUPABASE_TABLE=security_logs

# Optional timing overrides (seconds)
NORMAL_LOG_INTERVAL_SECONDS=2
ATTACK_BURST_INTERVAL_SECONDS=30
ATTACK_BURST_SIZE=20
ATTACK_BURST_INTRA_DELAY_SECONDS=0.15
```

### 4. `log_engine.py` — build this piece by piece

**4a. Imports & setup**
- Import `os`, `time`, `random`, `uuid`, `signal`, `sys`, `ipaddress`, `logging`, `dataclasses`, `datetime`.
- Import `Faker` from `faker`, `create_client`/`Client` from `supabase`.
- Try importing `dotenv.load_dotenv` and call it; wrap in `try/except ImportError` so the script still runs if `python-dotenv` isn't installed.
- Configure Python's `logging` module (timestamped, leveled console output) — this is the script's *own* operational log, separate from the fake log rows it writes to the DB. Don't conflate the two.

**4b. Configuration constants (all read from env vars, all with sane defaults)**
- `SUPABASE_URL`, `SUPABASE_KEY` — default to obvious placeholder strings like `"https://your-project-ref.supabase.co"` and `"your-supabase-service-or-anon-key"`.
- `TABLE_NAME` — default `"security_logs"`.
- `NORMAL_LOG_INTERVAL_SECONDS` (default 2), `ATTACK_BURST_INTERVAL_SECONDS` (default 30), `ATTACK_BURST_SIZE` (default 20), `ATTACK_BURST_INTRA_DELAY_SECONDS` (default 0.15) — small delay between each row in a burst so 20 inserts land as a believable rapid sequence rather than one instantaneous bulk write.
- `MAX_INSERT_RETRIES` (default 3), `RETRY_BACKOFF_BASE_SECONDS` (default 1.5).
- `MITRE_BRUTE_FORCE_TAG = "T1110"`.
- A fixed pool of **IETF-reserved documentation/example address blocks** (RFC 5737 for IPv4, RFC 3849 for IPv6) used only to make the *simulated* attacker IP look like a single, consistent external source. These ranges are reserved specifically for documentation and testing use and are never allocated to real hosts, so no real-world attribution is implied:
  - `192.0.2.0/24` (TEST-NET-1)
  - `198.51.100.0/24` (TEST-NET-2)
  - `203.0.113.0/24` (TEST-NET-3)
  - `2001:db8::/32` (IPv6 documentation range)
  No real host in these ranges is ever contacted — this is only used to pick a fake IP string.

**4c. Data model**
Define a `LogRow` dataclass with fields: `id` (str/uuid), `timestamp` (ISO 8601 str, UTC), `source_ip` (str), `log_type` (`"ssh"` or `"nginx"`), `message` (str), `is_anomaly` (bool), `mitre_tag` (Optional[str]). Give it a `to_dict()` method for inserting into Supabase.

**4d. Supabase client**
- `build_supabase_client()` — instantiate the client from `SUPABASE_URL`/`SUPABASE_KEY`. If either still contains the placeholder text, log a warning (don't crash) telling the user to set real credentials.
- `insert_row(client, row)` — insert one `LogRow` via `client.table(TABLE_NAME).insert(row.to_dict()).execute()`, wrapped in a retry loop: on exception, log the error, sleep with linearly increasing backoff (`RETRY_BACKOFF_BASE_SECONDS * attempt`), retry up to `MAX_INSERT_RETRIES` times, then give up and log a final failure without crashing the process.

**4e. `generate_normal_log()`**
- Randomly choose `"ssh"` or `"nginx"`.
- SSH: build a string like `Accepted password for {user} from {ip} port {port} ssh2` using `Faker`'s `user_name()` and `ipv4_public()`, and a random port 1024–65535.
- Nginx: build a standard combined-log-format access line using `Faker`'s `uri_path()` and `user_agent()`, a realistic timestamp, and a status code weighted toward 200s.
- Return a fully populated `LogRow` with `is_anomaly=False`, `mitre_tag=None`.

**4f. `generate_attack_burst(size=ATTACK_BURST_SIZE)`**
- Pick **one** random IP from the documentation/example CIDR blocks defined in 4b (use Python's `ipaddress` module to pick a valid host address inside a randomly chosen block — not just string-formatted random octets).
- Build `size` (default 20) `LogRow`s, all sharing that same attacker IP, each with `log_type="ssh"`, message `Failed password for root from {ip} port {port} ssh2` (random port each time), `is_anomaly=True`, `mitre_tag="T1110"`.
- Return the list of rows.

**4g. Main loop**
- Register `SIGINT`/`SIGTERM` handlers that set a module-level `_shutdown_requested` flag so Ctrl+C exits cleanly after finishing the current cycle, instead of dying mid-write with a raw traceback.
- Build the Supabase client once, log a startup line summarizing the configured intervals.
- Loop `while not _shutdown_requested`:
  - Track `last_normal_ts` and `last_burst_ts` using `time.monotonic()`.
  - If `NORMAL_LOG_INTERVAL_SECONDS` have elapsed since `last_normal_ts`: generate + insert one normal log, log it at INFO level, update `last_normal_ts`.
  - If `ATTACK_BURST_INTERVAL_SECONDS` have elapsed since `last_burst_ts`: log a WARNING that a burst is starting, generate the burst, insert each row with the small intra-burst delay, log a WARNING summary (rows inserted / attacker IP) when done, update `last_burst_ts`.
  - `time.sleep(0.1)` each iteration to avoid busy-waiting.
- On clean shutdown, log a final message and `sys.exit(0)`.

### 5. `README.md`
Short setup instructions:
```bash
cp .env.example .env        # paste in your real SUPABASE_URL / SUPABASE_KEY
pip install -r requirements.txt
# In the Supabase SQL editor, run schema.sql once to create the table
python log_engine.py
```
Mention Ctrl+C stops it cleanly.

## HARD CONSTRAINTS (do not violate)
- **No web server** — no Flask/FastAPI/socket listener/HTTP endpoint anywhere in this project. It is a standalone script only.
- **No real credentials in code** — `SUPABASE_URL`/`SUPABASE_KEY` must only ever come from environment variables (or `.env`), never hardcoded with real values. Ship placeholders.
- **No real attack traffic** — the "attack" is purely fabricated log *strings* written to the user's own database. Nothing in this script sends packets, opens connections, or interacts with any IP address it generates — those IPs only ever appear as text inside a log message and a `source_ip` column, and are drawn exclusively from IETF-reserved documentation ranges (RFC 5737 / RFC 3849) that are never assigned to real hosts.
- Attack rows must always have `is_anomaly=True` and `mitre_tag="T1110"`; normal rows must always have `is_anomaly=False` and `mitre_tag=None`.
- All 20 rows in a single burst must share the exact same source IP (that's what makes it a recognizable brute-force pattern for a detector to catch).

## ACCEPTANCE CHECKLIST — verify every line before calling this done

| # | Requirement | How to verify |
|---|---|---|
| 1 | `requirements.txt` exists and installs cleanly | `pip install -r requirements.txt` succeeds |
| 2 | Script is named `log_engine.py` | file exists at project root |
| 3 | Supabase client built from `SUPABASE_URL`/`SUPABASE_KEY` env vars, with placeholders as defaults | inspect `build_supabase_client()`; run script with no `.env` and confirm it warns instead of crashing |
| 4 | `generate_normal_log()` produces a valid SSH or Nginx line via Faker | call it in a REPL, print the dict, confirm fields are populated and format looks like a real log line |
| 5 | `generate_attack_burst()` produces 20 "Failed password for root" rows from one random documentation-range IP | call it, confirm `len(rows) == 20` and `len(set(r.source_ip for r in rows)) == 1` |
| 6a | Main loop runs indefinitely until stopped | run script, confirm it doesn't exit on its own |
| 6b | Normal log inserted every 2s (default) | watch console/DB for ~10s, confirm ~5 normal rows |
| 6c | Attack burst triggered every 30s (default) | watch console/DB for 30s+, confirm a burst of 20 rows appears |
| 6d | Attack rows have `is_anomaly=True`, `mitre_tag="T1110"`; normal rows don't | query the DB or inspect logged dicts directly |
| 7 | No web server / HTTP listener anywhere in the project | grep for `Flask`, `FastAPI`, `http.server`, `socket.bind` — should find nothing |
| 8 | Placeholder credentials ship by default; real ones only via `.env` | check `.env.example` exists, `.env` is not committed, code has no real keys |
| 9 | Ctrl+C exits cleanly (no raw traceback) | run script, press Ctrl+C, confirm a clean shutdown log line and exit code 0 |
| 10 | Failed inserts retry with backoff instead of crashing the process | (optional) temporarily break `SUPABASE_KEY` and confirm the script logs retries instead of dying |

Do not consider the mission complete until every row above is checked.
