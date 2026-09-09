# Phase 4 — Final Systems Integration (Enhanced Prompt)

You are an expert full-stack developer acting as the final systems integrator for
TraceGrid. Three folders contain modular work built by the team:

1. `Phase_1` — Next.js frontend: Tailwind glassmorphism, 3D Spline background, layout
   panels, and a `ThreatSource` data-abstraction (`lib/types.ts`) that every panel
   depends on instead of any concrete data source.
2. `Phase_2` — Python log simulation + anomaly detection engine, pushing rows to a
   Supabase `security_logs` table.
3. `Phase_3` — Gemini AI investigation API route (`/api/investigate`) with prompt
   engineering for explanations, predicted next move, and remediation scripts.

Your mission: unify these into one working application with zero conflicts, **without
breaking the interface contracts Phase 1 already established.**

---

### STEP 0: READ BEFORE YOU TOUCH ANYTHING

Before writing code, open `lib/types.ts` and re-read the `ThreatSource` interface and
`ThreatEvent`/`LogLine` types. Every panel (`LiveLogFeedPanel`, `MitreMapPanel`,
`AiInvestigatorPanel`) currently receives a `source: ThreatSource` prop and knows
nothing about where that data comes from. **Your job is to write a new implementation
of `ThreatSource` backed by Supabase — not to rewrite the panels or `page.tsx` to
fetch data directly.** If you find yourself adding `fetch`/`setInterval` calls inside
a panel component or `page.tsx`, stop — that logic belongs in the new data source
file described in Step 3.

Also note the existing layering rules and do not violate them while wiring data:
- Background stage (`Spline` + `RedAlertOverlay`) stays inside its `isolate` wrapper.
- The center grid column stays `pointer-events-none` and visually empty except the
  alert badge.
- Panel borders react via the shared `GlassPanel` component, not ad hoc classNames.

---

### STEP 1: CONSOLIDATE PROJECT STRUCTURE

- Keep the full Next.js App Router project at the root (move `Phase_1` contents to
  root if needed so `npm run dev` serves the dashboard directly).
- Copy the API route from `Phase_3` into `app/api/investigate/route.ts`.
- Move `Phase_2` into `backend_simulator/`, containing its Python scripts and
  `requirements.txt`. This folder is **not** part of the Next.js build.
- Do not delete original code without first confirming its functionality has been
  merged somewhere. If something looks redundant (e.g. `DashboardGrid.tsx` from an
  earlier layout iteration), flag it in your summary rather than silently dropping it.

---

### STEP 2: DEPENDENCY & ENVIRONMENT ALIGNMENT

Add to the Next.js `package.json`:
- `@splinetool/react-spline`, `@splinetool/runtime`
- `@supabase/supabase-js`
- `@google/generative-ai`
- `lucide-react`

**Two separate env files — do not merge them:**

`.env.local` (root, Next.js — client-safe values only):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```
`GEMINI_API_KEY` has no `NEXT_PUBLIC_` prefix — it's only ever read inside
`app/api/investigate/route.ts` (server-side), never in client components.

`backend_simulator/.env` (Python simulator only — never exposed to the frontend):
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```
The simulator needs the **service role key** to insert rows past row-level security.
This key must never appear in `.env.local`, in any `NEXT_PUBLIC_*` variable, or in
any file the Next.js build bundles client-side. If it ends up in the browser, it's a
full database compromise, not a minor leak — treat this as a hard rule.

---

### STEP 3: WIRE DATA FLOW (THE STITCH)

**3a. Implement `lib/supabaseThreatSource.ts`** conforming to the existing
`ThreatSource` interface:

```ts
import { createClient } from "@supabase/supabase-js";
import { MITRE_CATALOG } from "./mitreCatalog";
import type { ThreatSource, LogLine, ThreatEvent } from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const seenIds = new Set<string>(); // dedupe guard

function mapRowToLogLine(row: any): LogLine {
  return {
    id: row.id,
    timestamp: row.created_at,
    raw: row.log_text,
    flagged: row.is_anomaly === true,
  };
}

function mapRowToThreatEvent(row: any): ThreatEvent | null {
  const catalogEntry = MITRE_CATALOG[row.mitre_tag as keyof typeof MITRE_CATALOG];
  if (!catalogEntry) return null;
  return {
    id: row.id,
    timestamp: row.created_at,
    sourceIp: row.source_ip,
    techniqueId: catalogEntry.id,
    techniqueName: catalogEntry.name,
    tactic: catalogEntry.tactic,
    severity: row.severity ?? "high",
    rawLogLine: row.log_text,
  };
}

export const supabaseThreatSource: ThreatSource = {
  onLogLine(callback) {
    const channel = supabase
      .channel("security_logs_lines")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_logs" },
        (payload) => callback(mapRowToLogLine(payload.new))
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  onThreatEvent(callback) {
    const channel = supabase
      .channel("security_logs_threats")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_logs" },
        (payload) => {
          const row = payload.new as any;
          if (!row.is_anomaly || seenIds.has(row.id)) return; // dedupe: only fire on genuinely new anomalies
          seenIds.add(row.id);
          const event = mapRowToThreatEvent(row);
          if (event) callback(event);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  triggerAttack() {
    // No-op in production — real attacks originate from backend_simulator/.
    // Left as a no-op (not deleted) so the interface stays satisfied and
    // SimulateAttackButton doesn't crash if rendered in DEMO_MODE.
  },
};
```

> If your Supabase project has Realtime replication disabled and there's no time to
> enable it mid-hackathon, fall back to polling the latest 10 rows every 2–3s
> **inside this same file** (not in `page.tsx`) — keep tracking `seenIds` so repeat
> polls of already-seen rows never re-fire `onThreatEvent`. The interface contract
> is what matters; the transport underneath it can be Realtime or polling.

**3b. Demo safety net — `DEMO_MODE` fallback.** Add one env var:
```
NEXT_PUBLIC_DEMO_MODE=false
```
In `page.tsx`, choose the source once:
```ts
import { mockThreatSource } from "@/lib/mockThreatEngine";
import { supabaseThreatSource } from "@/lib/supabaseThreatSource";

const threatSource =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? mockThreatSource : supabaseThreatSource;
```
This is the entire integration surface in `page.tsx` — if Supabase or wifi fails
during judging, flip one env var and redeploy/restart to fall back to the
self-contained mock demo instantly.

**3c. AI Investigator wiring.** On clicking a flagged log row:
- Guard against double-fires (disable the row or debounce) while a request is in flight.
- Show a loading state in `AiInvestigatorPanel` immediately.
- POST `{ log_text }` to `/api/investigate`.
- On success, render `explanation`, `predicted_next_move`, `remediation_script`.
- On failure (network error, non-200, malformed JSON), show a clear inline error
  state in the panel — never leave it silently stuck on the loading skeleton.

---

### STEP 4: VERIFICATION

- Run `npm run build`; resolve all type errors and broken imports before considering
  this done — do not just eyeball the file tree.
- Confirm `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` do not appear in any
  client bundle (`grep` the `.next` build output if unsure).
- Manually insert a test row into `security_logs` (or run the simulator briefly) and
  confirm: the log feed updates, the MITRE panel shows the mapped technique, the red
  alert overlay fires once (not repeatedly) for that single anomaly.
- Toggle `NEXT_PUBLIC_DEMO_MODE=true` and confirm the app runs fully offline using
  the mock engine, with identical UI behavior.

**Definition of Done:**
- [ ] `page.tsx` only decides *which* `ThreatSource` to use — no fetch/polling logic lives there.
- [ ] Panels are unchanged from Phase 1 except for receiving live data through the same `source` prop.
- [ ] Service role key is never referenced outside `backend_simulator/`.
- [ ] A single new anomaly triggers exactly one alert cycle, not one per poll/render.
- [ ] `/api/investigate` failures degrade gracefully in the UI.
- [ ] `DEMO_MODE` fallback verified working with no network.

---

### STEP 5: RUN INSTRUCTIONS

Produce a short runbook reflecting the actual final structure, covering at minimum:
- Terminal 1: install + start the Next.js app (`npm install && npm run dev`).
- Terminal 2: set up and run the Python simulator (`pip install -r requirements.txt`
  inside `backend_simulator/`, then the run command).
- Where each `.env` file must live and which keys go in which one.
- (Optional, if time allows) a root-level script using `concurrently` to start both
  with a single `npm run dev:all` command for faster judge demos.
