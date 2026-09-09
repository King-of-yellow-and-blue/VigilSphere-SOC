"use client";

import { ReactNode } from "react";

interface DashboardGridProps {
  children: ReactNode;
}

export function DashboardGrid({ children }: DashboardGridProps) {
  return (
    <div className="relative z-10 min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          TraceGrid
        </h1>
        <span className="text-xs text-white/40 font-mono tracking-widest uppercase ml-2">
          SOC Dashboard
        </span>
      </div>

      {/* 3-column grid on desktop, stacking on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {children}
      </div>
    </div>
  );
}

/** Reusable glassmorphism panel wrapper */
export function GlassPanel({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-5
        shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300
        hover:bg-white/[0.07] hover:border-white/15 ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-white/50">{icon}</span>}
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
