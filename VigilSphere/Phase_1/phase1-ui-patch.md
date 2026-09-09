# Phase 1 Patch — Layout Fix, Red Alert Upgrade, Panel Reactivity

## Context
Phase 1 is built and running. The MITRE panel currently sits in the center column,
blocking the Spline sphere. This patch reworks the grid so the center stays fully
visible, upgrades the Red Alert overlay to a glowing-ring effect, and makes panel
borders react to threat state.

## Files Touched
- `app/page.tsx` — rewritten (grid layout, center free-zone, critical badge)
- `components/RedAlertOverlay.tsx` — updated (radial gradient + inset glow)
- `components/GlassPanel.tsx` — **new** shared wrapper for reactive glass styling
- `components/DashboardGrid.tsx` — **deprecated**, no longer used (layout now lives directly in `page.tsx`); safe to delete or leave unimported
- `components/panels/*.tsx` — remove any outer `border`/`bg-*` wrapper div each panel may already render internally. Panels should render only their *content* (list, cards, text) — the surrounding glass card now comes from `GlassPanel` in `page.tsx`. Rendering both causes a double border.

---

## 1. New — `components/GlassPanel.tsx`

Shared reactive glass container. Every dashboard panel gets wrapped in this instead
of styling itself.

```tsx
import type { ReactNode } from "react";

export function GlassPanel({
  active,
  className = "",
  children,
}: {
  active: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border bg-black/30 backdrop-blur-md p-4 transition-colors duration-500 ${
        active ? "border-red-500/50" : "border-white/10"
      } ${className}`}
    >
      {children}
    </div>
  );
}
```

---

## 2. Updated — `components/RedAlertOverlay.tsx`

Replaces the flat color wash with a pulsing radial gradient and inset glow —
a red ring around the screen edges, center left clear.

```tsx
export function RedAlertOverlay({ active }: { active: boolean }) {
  return (
    <div
      className={
        "absolute inset-0 z-0 pointer-events-none transition-all duration-1000 " +
        (active
          ? "opacity-100 shadow-[inset_0_0_150px_rgba(220,38,38,0.5)] bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(220,38,38,0.15)_100%)] animate-pulse"
          : "opacity-0")
      }
    />
  );
}
```

`isolation: isolate` on the parent wrapper (unchanged from the previous patch) still
applies — this keeps the gradient/glow scoped to the background stage only.

---

## 3. Rewritten — `app/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { SplineBackground } from "@/components/SplineBackground";
import { RedAlertOverlay } from "@/components/RedAlertOverlay";
import { GlassPanel } from "@/components/GlassPanel";
import { SimulateAttackButton } from "@/components/SimulateAttackButton";
import { LiveLogFeedPanel } from "@/components/panels/LiveLogFeedPanel";
import { MitreMapPanel } from "@/components/panels/MitreMapPanel";
import { AiInvestigatorPanel } from "@/components/panels/AiInvestigatorPanel";
import { mockThreatSource } from "@/lib/mockThreatEngine";

export default function Home() {
  const [isThreatDetected, setIsThreatDetected] = useState(false);

  useEffect(() => {
    const unsubscribe = mockThreatSource.onThreatEvent(() => {
      setIsThreatDetected(true);
      window.setTimeout(() => setIsThreatDetected(false), 4000);
    });
    return unsubscribe;
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Background stage — Spline + Red Alert overlay, isolated from the UI layer */}
      <div className="fixed inset-0 isolate">
        <SplineBackground />
        <RedAlertOverlay active={isThreatDetected} />
      </div>

      {/* UI layer */}
      <div className="relative z-10 flex min-h-screen flex-col gap-6 p-6">
        <header className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">TraceGrid</h1>
          <span className="text-xs uppercase tracking-widest text-white/50">
            SOC Dashboard
          </span>
        </header>

        <div className="grid flex-1 grid-cols-12 gap-6">
          {/* Left column — Live Log Feed */}
          <div className="col-span-3">
            <GlassPanel active={isThreatDetected} className="h-full">
              <LiveLogFeedPanel source={mockThreatSource} />
            </GlassPanel>
          </div>

          {/* Center column — kept empty so the Spline sphere is 100% visible */}
          <div className="col-span-6 flex items-center justify-center pointer-events-none">
            {isThreatDetected && (
              <div className="animate-bounce">
                <div className="flex items-center gap-2 rounded-full border border-red-400/50 bg-red-600/90 px-6 py-3 shadow-[0_0_40px_rgba(220,38,38,0.6)] backdrop-blur-sm">
                  <AlertTriangle className="h-4 w-4 text-white" />
                  <span className="text-sm font-bold tracking-widest text-white">
                    CRITICAL ANOMALY DETECTED
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right column — MITRE map stacked above AI Investigator */}
          <div className="col-span-3 flex flex-col gap-6">
            <GlassPanel active={isThreatDetected}>
              <MitreMapPanel source={mockThreatSource} />
            </GlassPanel>
            <GlassPanel active={isThreatDetected} className="flex-1">
              <AiInvestigatorPanel />
            </GlassPanel>
          </div>
        </div>

        <SimulateAttackButton source={mockThreatSource} />
      </div>
    </main>
  );
}
```

### Why the center column is `pointer-events-none`
The badge itself doesn't need clicks, and disabling pointer events on the whole
column guarantees nothing in that 6-column strip can ever intercept a click meant
for the 3D scene beneath it — even if content gets added there later.

### Panel prop contract (unchanged from master spec)
`LiveLogFeedPanel` and `MitreMapPanel` take `source: ThreatSource` as a prop — they
do not import `mockThreatSource` themselves. This is what keeps them swappable for
Phase 2's real data source with zero panel-code changes.

---

## Acceptance Criteria
- [ ] Center 6 columns show the Spline sphere with nothing overlapping it except the badge during an active alert.
- [ ] Badge appears with `animate-bounce`, disappears when `isThreatDetected` clears.
- [ ] All three panels render as frosted glass: `bg-black/30`, `backdrop-blur-md`, `border-white/10` at rest.
- [ ] During an alert, all panel borders shift to `border-red-500/50` and the screen edges glow red via the inset shadow + radial gradient — no flat color wash.
- [ ] Clicking anywhere in the center column while an alert is active passes through to whatever's beneath it (verify via DevTools — no click blocked by that column).
- [ ] No panel renders a duplicate border/background from its own internal markup — only `GlassPanel` supplies the card chrome.
- [ ] `DashboardGrid.tsx` is no longer imported anywhere.
