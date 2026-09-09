"use client";

import { Zap, Crosshair } from "lucide-react";
import type { ThreatSource } from "@/lib/types";

export function SimulateAttackButton({
  threatSource,
}: {
  threatSource: ThreatSource;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        id="simulate-brute-force"
        onClick={() => threatSource.triggerAttack("brute_force")}
        className="group flex items-center gap-2 px-4 py-2.5 rounded-xl
          bg-gradient-to-r from-red-500/20 to-orange-500/20
          border border-red-500/30 hover:border-red-400/50
          text-red-300 hover:text-red-200
          text-sm font-medium tracking-wide
          transition-all duration-300
          hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]
          active:scale-95 cursor-pointer"
      >
        <Zap className="h-4 w-4 transition-transform group-hover:scale-110" />
        Simulate Brute Force
      </button>

      <button
        id="simulate-port-scan"
        onClick={() => threatSource.triggerAttack("port_scan")}
        className="group flex items-center gap-2 px-4 py-2.5 rounded-xl
          bg-gradient-to-r from-yellow-500/20 to-amber-500/20
          border border-yellow-500/30 hover:border-yellow-400/50
          text-yellow-300 hover:text-yellow-200
          text-sm font-medium tracking-wide
          transition-all duration-300
          hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]
          active:scale-95 cursor-pointer"
      >
        <Crosshair className="h-4 w-4 transition-transform group-hover:scale-110" />
        Simulate Port Scan
      </button>
    </div>
  );
}
