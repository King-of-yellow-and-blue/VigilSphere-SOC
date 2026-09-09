# MODULE 1: Multi-Source Engine & SOAR Simulator

## DIRECTIVES
Create a Python backend directory `simulator/`. We need a script that generates enterprise logs and simulates cyberattacks, writing directly to Supabase.

## TECH STACK
Python, `faker`, `supabase-py`, `python-dotenv`

## PREREQUISITES
The Supabase schema (`security_logs` columns + `soar_actions` table, see SQL snippet) must already exist before this script runs. This script uses the **service role key**, loaded from `simulator/.env` (not the root `.env.local` used by the frontend) — this key must never be shared with or committed alongside any Next.js environment file, since it bypasses row-level security entirely.

## EXECUTION STEPS
1. Create `simulator/requirements.txt` with: `faker`, `supabase`, `python-dotenv`.
2. Create `simulator/.env` (gitignored) with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Create `simulator/log_engine.py`.
4. Set up a Supabase client using the service role key loaded via `python-dotenv`.
5. **Concurrency:** Run two independent timers so the 2-second and 30-second cycles don't block each other — e.g. one `threading.Thread` for normal log generation and another for attack bursts, both looping for the script's lifetime.
6. **Normal Log Generation:** Every 2 seconds, randomly generate and insert one of four log formats using Faker:
   - Linux Auth (`sshd: Accepted publickey...`)
   - Windows Event (`EventID: 4624...`)
   - Apache Access (`GET /api/v1/health HTTP/1.1...`)
   - Syslog (`kernel: [UFW ALLOW]...`)
7. **Attack Simulation:** Every 30 seconds, trigger an attack burst, randomly choosing between:
   - Brute Force (T1110) -> target_node: 'USER_ACCOUNTS', severity: 'CRITICAL'
   - Port Scan (T1046) -> target_node: 'NETWORK', severity: 'HIGH'
   - Privilege Escalation (T1068) -> target_node: 'SERVICES', severity: 'CRITICAL'
8. **SOAR Action:** When an attack is generated, insert the log into `security_logs` with `is_anomaly = True`, and **capture the returned row's `id`** from the insert response. Immediately insert a corresponding row into `soar_actions` using that captured id as `alert_id`:
   - Action types: `LOCK_ACCOUNT` (Brute Force), `BLOCK_IP` (Port Scan), `SUSPEND_SESSION` (PrivEsc).
   - Set `status` to `auto_applied`.
   - If the insert into `security_logs` fails or returns no id, skip the `soar_actions` insert and log the error rather than inserting an orphaned action row.
9. **Resilience:** Wrap Supabase calls in try/except with a short retry (e.g. one retry after 1s backoff) so a transient network blip during the demo doesn't kill the whole script. Print a concise console line for every insert (e.g. `[BRUTE FORCE] logged + SOAR: LOCK_ACCOUNT -> USER_ACCOUNTS`) so you have a live terminal view for debugging during judging.