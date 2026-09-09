# Phase 1 — TraceGrid Evaluation MVP (Master Agent Build Spec)

## Objective
Build a visually striking, reactive Next.js SOC dashboard that convinces judges of the
full pipeline concept before the FastAPI backend is wired up. Everything in this phase
runs client-side, but it MUST be structured so Phase 2 can swap in real data sources
without touching component code.

## Tech Stack
- Next.js (App Router), React, TypeScript
- Tailwind CSS (glassmorphism aesthetic)
- lucide-react (icons)
- `@splinetool/react-spline` — imported from the `/next` subpath specifically, to avoid
  SSR hydration issues in the App Router:
  ```bash
  npm install @splinetool/react-spline
  ```
  ```tsx
  import Spline from "@splinetool/react-spline/next";
  ```

## Guiding Principle for This Phase
Nothing here should be "fake" in a way that has to be thrown away. Every mock built now
must implement the same interface the real Phase 2 implementation will use. Judges are
seeing an early slice of the real pipeline, not a disposable prototype.

---

## File Structure

```
/app
  layout.tsx
  page.tsx
  globals.css
/components
  SplineBackground.tsx
  RedAlertOverlay.tsx
  DashboardGrid.tsx
  SimulateAttackButton.tsx
  panels/
    LiveLogFeedPanel.tsx
    MitreMapPanel.tsx
    AiInvestigatorPanel.tsx
/lib
  types.ts
  mitreCatalog.ts
  mockThreatEngine.ts
```

---

## 1. Data Contract — `lib/types.ts`

Define this first. Every panel consumes data through these types, regardless of
whether the source is mocked (Phase 1) or real (Phase 2+).

```ts
export type Severity = "low" | "medium" | "high" | "critical";

export interface ThreatEvent {
  id: string;
  timestamp: string;       // ISO 8601
  sourceIp: string;
  destPort?: number;
  techniqueId: string;     // e.g. "T1110"
  techniqueName: string;   // e.g. "Brute Force"
  tactic: string;          // e.g. "Credential Access"
  severity: Severity;
  rawLogLine: string;
  summary?: string;        // populated by Gemini in Phase 3; undefined here
}

export interface LogLine {
  id: string;
  timestamp: string;
  raw: string;
  flagged: boolean;        // true if part of a detected attack
}

/**
 * Any threat source (mock or real) implements this interface.
 * Phase 1: MockThreatSource. Phase 2: WebSocketThreatSource / Supabase Realtime.
 * Panels and pages depend ONLY on this interface, never on the implementation.
 */
export interface ThreatSource {
  onLogLine(callback: (line: LogLine) => void): () => void;   // returns unsubscribe fn
  onThreatEvent(callback: (event: ThreatEvent) => void): () => void;
  triggerAttack(kind: "brute_force" | "port_scan"): void;
}
```

---

## 2. Static MITRE Lookup — `lib/mitreCatalog.ts`

Use real technique data, not placeholder text. This also becomes the lookup table
the real detection engine references in Phase 2.

```ts
export const MITRE_CATALOG = {
  brute_force: {
    id: "T1110",
    name: "Brute Force",
    tactic: "Credential Access",
  },
  port_scan: {
    id: "T1046",
    name: "Network Service Discovery",
    tactic: "Discovery",
  },
} as const;
```

---

## 3. Mock Threat Engine — `lib/mockThreatEngine.ts`

Implements `ThreatSource`. Generates a believable synthetic `auth.log`/`syslog` stream
at idle, and bursts a recognizable attack pattern when triggered.

Requirements:
- Emits 1 benign `LogLine` every 2–4s at idle (e.g. `sshd[1234]: Accepted password for user1 from 10.0.0.5 port 51322 ssh2`).
- `triggerAttack("brute_force")`:
  - Emits ~8 `LogLine`s in quick succession (150ms apart) simulating repeated failed SSH logins from one IP, each `flagged: true`.
  - Emits one `ThreatEvent` using `MITRE_CATALOG.brute_force`, severity `"high"`.
- `triggerAttack("port_scan")`:
  - Emits ~10 flagged `LogLine`s simulating sequential port connection attempts from one IP.
  - Emits one `ThreatEvent` using `MITRE_CATALOG.port_scan`, severity `"medium"`.
- Exported as a singleton `mockThreatSource: ThreatSource` so `page.tsx` can pass it down.

---

## 4. Spline Background — `components/SplineBackground.tsx`

Use this exact production scene URL. Do not swap in a placeholder or different asset.

```tsx
"use client";

import Spline from "@splinetool/react-spline/next";

const SCENE_URL = "https://prod.spline.design/prMqvXvATuupxYv8/scene.splinecode";

export function SplineBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <Spline scene={SCENE_URL} />
    </div>
  );
}
```

Notes:
- Do not attempt to manipulate colors/materials on this scene programmatically —
  it's a pre-built asset. All "reactivity" comes from the overlay in section 5.
- Add a lightweight loading fallback (e.g. a centered glass spinner) shown while
  the WebGL canvas mounts, since Spline scenes can take a second to initialize.

---

## 5. Background Stage & Red Alert Overlay

The Spline layer and the alert overlay live together in one wrapper, isolated from
the UI grid so the blend-mode can never bleed upward.

```tsx
// Parent wrapper — e.g. in page.tsx or a BackgroundStage.tsx
<div className="fixed inset-0 isolate">
  <SplineBackground />                         {/* Layer 1 — z-0 */}
  <RedAlertOverlay active={isThreatDetected} /> {/* Layer 2 — z-0, painted after Layer 1 in DOM order */}
</div>
```

```tsx
// RedAlertOverlay.tsx
export function RedAlertOverlay({ active }: { active: boolean }) {
  return (
    <div
      className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-500
        ${active ? "opacity-100 bg-red-900/30 mix-blend-color-dodge animate-pulse" : "opacity-0"}`}
    />
  );
}
```

Why it's built this way:
- Both Layer 1 and Layer 2 sit at `z-0` — same-index elements stack by DOM order, so
  the overlay (rendered after the Spline component) paints on top of it automatically.
- `isolation: isolate` on the shared wrapper scopes `mix-blend-color-dodge` to just
  these two layers, so it can never wash out the glass panels in Layer 3, regardless
  of what else gets added to the page later.
- `pointer-events-none` on the overlay is critical — it's a purely visual layer and
  must never block clicks intended for the UI above it.

---

## 6. Dashboard Grid — `components/DashboardGrid.tsx`

- `relative z-10`, sits above the background stage, outside the `isolate` wrapper.
- `bg-black/10 backdrop-blur-sm pointer-events-auto` on the grid container.
- Glassmorphism panels: `bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl`.
- Layout: 3-column grid on desktop (Live Log Feed | MITRE Map | AI Investigator), stacking on mobile.

---

## 7. Panels

### `panels/LiveLogFeedPanel.tsx`
- Subscribes to `threatSource.onLogLine(...)` on mount, unsubscribes on unmount.
- Renders a scrolling list of the last ~30 `LogLine`s, newest on top.
- `flagged: true` lines render in red text with a small pulsing dot; others in muted gray/green monospace.

### `panels/MitreMapPanel.tsx`
- Subscribes to `threatSource.onThreatEvent(...)`.
- Renders each event as a card: technique ID + name + tactic (from `MITRE_CATALOG`), severity badge, source IP, timestamp.
- Empty state: "No techniques detected yet — system nominal."

### `panels/AiInvestigatorPanel.tsx`
- Displays the most recent `ThreatEvent.summary`.
- Since `summary` is always `undefined` in Phase 1, render a skeleton/shimmer state with text: *"Awaiting AI analysis — connect Gemini in Phase 3."*
- **Do not** stub any API key handling, fetch calls, or client-side Gemini logic here. This panel stays purely presentational until the backend proxy exists.

---

## 8. Simulate Attack Button — `components/SimulateAttackButton.tsx`

- Two buttons (or a dropdown): "Simulate Brute Force" / "Simulate Port Scan".
- On click, calls `threatSource.triggerAttack(kind)` — nothing else. All downstream effects (log lines, MITRE card, red overlay) happen because panels are already subscribed.
- Lift a single `isThreatDetected` boolean in `page.tsx`, set via `onThreatEvent` callback, passed to `RedAlertOverlay`. Auto-clear after ~4s.

---

## Acceptance Criteria (Phase 1 Demo-Ready Checklist)

- [ ] `npm install @splinetool/react-spline` completes and the scene loads from the exact `prMqvXvATuupxYv8` URL — verify in the Network tab, not just visually.
- [ ] Spline scene renders full-screen and loads without layout shift.
- [ ] Clicking "Simulate Brute Force" produces: a burst of flagged log lines in the feed, a MITRE card showing T1110 / Brute Force / Credential Access, and the red overlay pulsing correctly scoped (no bleed into glass panels).
- [ ] Clicking "Simulate Port Scan" produces the T1046 equivalent.
- [ ] Panels in Layer 3 remain fully clickable while the overlay is active.
- [ ] AI Investigator panel shows a clean "awaiting analysis" skeleton — no console errors, no exposed keys.
- [ ] All panels read from `ThreatSource`/`ThreatEvent`/`LogLine` types only — no component imports `mockThreatEngine` directly except the top-level `page.tsx`.
- [ ] Swapping `mockThreatSource` for a real implementation in Phase 2 requires touching only `page.tsx`.

---

## Explicitly Out of Scope for Phase 1
- FastAPI backend, log ingestion, real detection logic (Phase 2)
- Supabase / pgvector (Phase 2+ / stretch)
- Gemini API calls of any kind (Phase 3)
