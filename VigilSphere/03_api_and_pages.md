# MODULE 3: AI Intelligence & Subsidiary Pages

## DIRECTIVES
Build the Gemini AI investigation route and the secondary product pages to complete the enterprise SaaS illusion.

## TECH STACK
Next.js, `@google/generative-ai`

## EXECUTION STEPS
1. **Gemini API Route (`app/api/investigate/route.ts`):**
   - Create a POST endpoint accepting a `log_text`.
   - Prompt Gemini to act as a SOC Analyst and return ONLY raw JSON matching this schema:
     `{"explanation": "...", "predicted_next_move": "...", "remediation_script": "..."}`
   - Read `GEMINI_API_KEY` from `process.env` with no `NEXT_PUBLIC_` prefix — it's only ever used inside this server route.
   - Models don't always honor "return only JSON" perfectly, so defensively parse the response: strip any ` ```json ` code-fence wrapping before `JSON.parse`, and wrap the parse in try/catch. If parsing fails or the API call errors/times out, return a clear error JSON (e.g. `{ "error": "..." }`) with a non-200 status rather than letting a malformed response crash the caller.
2. **Triage Page (`app/triage/page.tsx`):**
   - Build a dark-mode data table displaying historical alerts (fetch `security_logs` where `is_anomaly = true`, ordered by timestamp descending, with a reasonable page size or limit rather than unbounded "all rows").
   - Columns: Timestamp, Log Source, Incident Type, Severity, SOAR Status.
   - Include a loading state while fetching and an empty state ("No alerts yet") for a clean start.
   - Add a "Generate PDF Report" button at the top; since it's a mock for this phase, visibly disable it or show a "Coming soon" tooltip so it doesn't read as a broken feature to anyone clicking it.
3. **Integrations Page (`app/integrations/page.tsx`):**
   - Build a static CSS grid of 6 integration cards (AWS CloudTrail, Windows Server, Nginx, Syslog, CrowdStrike, Palo Alto).
   - Show mock metrics like "Status: ACTIVE" and "Ingestion: 2,100 eps".
   - Keep the same glassmorphism treatment as the main dashboard so it reads as one product rather than a bolted-on page.
4. **Global Navigation (`components/Sidebar.tsx`):**
   - Create a persistent side navigation bar linking to `/`, `/triage`, and `/integrations` using `lucide-react` icons.
   - Highlight the current route (e.g. via `usePathname`) so it's visually obvious which page is active during a live demo.