# MISSION: Gemini AI Cyber Investigator API

## OVERVIEW
Build an isolated Next.js API route that acts as the **"Brain"** of a SOC (Security Operations Center) dashboard. This API accepts a raw server log string, sends it to the Google Gemini API for analysis, and returns a strict JSON payload predicting the attacker's next move and a remediation command.

**DO NOT build any UI or frontend components. This is strictly a backend API task.**

---

## TECH STACK
| Component | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| AI SDK | `@google/generative-ai` |
| Model | `gemini-1.5-flash` (fast/cheap) or `gemini-1.5-pro` (higher accuracy) — configurable via env var |
| Runtime | Node.js (App Router Route Handler) |

---

## EXECUTION STEPS

### Step 1 — Project Setup
1. Initialize a minimal Next.js app (App Router, TypeScript) if one doesn't already exist.
2. Install the required dependency:
   ```bash
   npm install @google/generative-ai
   ```
3. Create a `.env.local` file with placeholder variables:
   ```
   GEMINI_API_KEY=your_placeholder_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```
4. Add `.env.local` to `.gitignore` (if not already present) — the API key must never be committed.

### Step 2 — Build the API Route
**File:** `app/api/investigate/route.ts`

1. Export a `POST` handler.
2. Parse the request body and extract `log_text`.
   - Validate that `log_text` is a non-empty string. If missing/invalid, return **400** with `{ "error": "log_text is required and must be a non-empty string." }`.
3. Initialize the `GoogleGenerativeAI` client using `process.env.GEMINI_API_KEY`.
   - If the key is missing/placeholder, fail fast with a **500** and a clear error message (don't let the SDK throw an opaque error).
4. Instantiate the model using `process.env.GEMINI_MODEL` (fallback to `gemini-1.5-flash`).
5. Construct a **System Prompt** that instructs Gemini to:
   - Act as an elite SOC (Security Operations Center) Analyst with deep knowledge of the MITRE ATT&CK framework.
   - Read the provided `log_text` and analyze the attack pattern, source, and technique.
   - Output **ONLY valid JSON** — no markdown code fences, no conversational preamble, no trailing commentary.
   - Strictly conform to the schema below, with no extra or missing keys.
6. **Required JSON Schema:**
   ```json
   {
     "explanation": "A plain English, 2-sentence summary of the attack.",
     "predicted_next_move": "The MITRE tactic the hacker will likely try next.",
     "remediation_script": "The exact bash command (e.g., ufw, iptables) to block the threat."
   }
   ```
7. Send the request to Gemini with the system prompt + `log_text` as the user turn.
8. **Response sanitation & parsing:**
   - Strip any leading/trailing ```` ```json ```` or ```` ``` ```` fences before parsing.
   - Trim whitespace.
   - Attempt `JSON.parse()`. If parsing fails, retry once with a stricter re-prompt ("Return ONLY the JSON object, nothing else"); if it fails again, return a **502** with `{ "error": "Model did not return valid JSON.", "raw": "<raw text>" }`.
   - Optionally validate the parsed object has exactly the three expected keys (`explanation`, `predicted_next_move`, `remediation_script`) as strings; if fields are missing, still return what was parsed but flag it, or reject — pick one approach and be consistent.
9. On success, return the parsed JSON with **status 200**.
10. On any unhandled error (network failure, SDK exception, etc.), catch it and return **status 500** with a generic `{ "error": "Internal server error." }` (log the real error server-side, don't leak stack traces to the client).

### Step 3 — Build a Testing Script
**File:** `test_api.js` (project root)

1. Use Node's built-in `fetch` to `POST` a dummy log to `http://localhost:3000/api/investigate`, e.g.:
   ```
   "Failed password for root from 185.12.34.56 port 22 ssh2"
   ```
2. Log the parsed JSON response to the console.
3. Add a couple of edge-case test calls too:
   - Empty `log_text` → expect 400.
   - A benign, non-attack log line → verify the model still returns valid schema-conforming JSON (even if the "attack" framing is a stretch).

---

## RULES / CONSTRAINTS
- Prompt engineering must **force** strict JSON-only output from Gemini — no markdown fences, no chit-chat.
- Always strip ```` ```json ```` / ```` ``` ```` fences defensively before parsing, even if the prompt asks Gemini not to use them.
- Never hardcode the API key in source — always read from `process.env.GEMINI_API_KEY`.
- No UI, no extra routes, no unrelated scaffolding — keep the deliverable scoped to `route.ts` + `test_api.js` (+ standard Next.js project files).
- Handle and clearly distinguish three failure modes: (1) bad input → 400, (2) malformed model output → 502, (3) unexpected/internal error → 500.
- The final deliverable is a working, self-contained `route.ts` file (plus the test script) that can be copied directly into the main project.

---

## DEFINITION OF DONE
- [ ] `npm install @google/generative-ai` completes cleanly.
- [ ] `app/api/investigate/route.ts` exists, compiles, and exports a `POST` handler.
- [ ] Posting a sample log returns HTTP 200 with a JSON body matching the exact schema (3 keys, correct types).
- [ ] Posting an empty/missing `log_text` returns HTTP 400 with a clear error.
- [ ] Simulated Gemini/API failure returns HTTP 500 without leaking internals.
- [ ] `test_api.js` runs against a local dev server and prints a clean, schema-conformant JSON object.
