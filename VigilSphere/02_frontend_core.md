# MODULE 2: VigilSphere Core UI & Blast Radius

## DIRECTIVES
Set up the Next.js frontend with Tailwind glassmorphism. Build the 3D dashboard, the Blast Radius visualization, and the SOAR review interface.

## TECH STACK
Next.js (App Router), `@splinetool/react-spline/next`, `lucide-react`, `@supabase/supabase-js`, Tailwind CSS.

## EXECUTION STEPS
1. Initialize the Next.js app in the root directory (alongside the `simulator` folder) and install dependencies. Frontend Supabase client uses only `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — never the service role key.
2. **Blast Radius Component (`components/BlastRadius.tsx`):**
   - Create an SVG diagram with 5 nodes: Network, Process Tree, File System, User Accounts, Services.
   - Accept an `activeNode` prop. If a node matches the prop, apply `stroke-red-500 animate-pulse` to simulate the attack's blast radius. Default state is faint cyan.
   - When `activeNode` is `null`/`undefined`, all nodes render in the default faint-cyan state.
3. **SOAR Review Component (`components/SoarReviewCard.tsx`):**
   - Build a UI card displaying "⚡ AUTONOMOUS CONTAINMENT APPLIED".
   - Accept props from the `soar_actions` table (action_type, target, reason, status).
   - Add two buttons: `[ Confirm Action ]` and `[ Rollback ]`. Clicking these should update the Supabase `soar_actions` table status to `'confirmed'` or `'rolled_back'` respectively.
   - Disable both buttons while the update request is in flight, and again once a status other than `auto_applied` is reached, so an action can't be confirmed and rolled back in quick succession or double-submitted.
   - Show a brief inline error state if the Supabase update fails, rather than leaving the buttons silently unresponsive.
4. **Main Dashboard (`app/page.tsx`):**
   - Implement the full-screen 3D Spline background (`https://prod.spline.design/prMqvXvATuupxYv8/scene.splinecode`), wrapped together with the alert overlay in a container using `isolation: isolate` so the overlay's blend/glow effects stay scoped to the background layer.
   - Implement the CSS Red Alert vignette overlay triggered by `isThreatDetected` — a pulsing radial gradient plus an inset box-shadow glow around the screen edges, leaving the center clear, rather than a flat color wash.
   - Wire a Supabase realtime listener (`postgres_changes` on `security_logs`/`soar_actions`; fall back to 2-second polling only if Realtime replication isn't enabled in time) to fetch the latest 15 logs and the latest `soar_action`.
   - Track already-seen anomaly ids so a multi-row attack burst triggers exactly one alert cycle, not one re-trigger per row.
   - Layout: Left panel (Live Log Feed), Center (empty except the 3D sphere + threat alert badge — keep this column `pointer-events-none` so clicks always pass through to the scene), Right panel (Blast Radius SVG above the SOAR Review Component).