"use client";

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
