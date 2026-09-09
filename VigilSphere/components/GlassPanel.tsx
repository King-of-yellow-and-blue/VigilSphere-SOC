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
