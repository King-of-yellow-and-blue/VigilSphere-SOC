"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, Info } from "lucide-react";
import type { ThreatEvent, ThreatSource, Severity } from "@/lib/types";


const SEVERITY_STYLES: Record<
  Severity,
  { bg: string; text: string; border: string; glow: string }
> = {
  critical: {
    bg: "bg-red-500/20",
    text: "text-red-300",
    border: "border-red-500/40",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.4)]",
  },
  high: {
    bg: "bg-orange-500/20",
    text: "text-orange-300",
    border: "border-orange-500/40",
    glow: "shadow-[0_0_12px_rgba(249,115,22,0.4)]",
  },
  medium: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-300",
    border: "border-yellow-500/40",
    glow: "shadow-[0_0_12px_rgba(234,179,8,0.4)]",
  },
  low: {
    bg: "bg-blue-500/20",
    text: "text-blue-300",
    border: "border-blue-500/40",
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.4)]",
  },
};

export function MitreMapPanel({
  threatSource,
}: {
  threatSource: ThreatSource;
}) {
  const [events, setEvents] = useState<ThreatEvent[]>([]);

  useEffect(() => {
    const unsub = threatSource.onThreatEvent((event) => {
      setEvents((prev) => [event, ...prev]);
    });
    return unsub;
  }, [threatSource]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-white/50"><Shield className="h-4 w-4" /></span>
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
          MITRE ATT&CK Map
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 min-h-[420px]">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
            <Info className="h-8 w-8 text-white/15" />
            <span className="text-sm text-center">
              No techniques detected yet — system nominal.
            </span>
          </div>
        ) : (
          events.map((event) => {
            const style = SEVERITY_STYLES[event.severity];
            return (
              <div
                key={event.id}
                className={`p-3 rounded-xl border ${style.border} ${style.bg} ${style.glow}
                  transition-all duration-500 animate-in slide-in-from-top-2`}
              >
                {/* Header: Technique ID + Severity Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-bold text-white/80 bg-white/10 px-2 py-0.5 rounded">
                      {event.techniqueId}
                    </code>
                    <span className="text-sm font-semibold text-white/90">
                      {event.techniqueName}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}
                  >
                    {event.severity}
                  </span>
                </div>

                {/* Tactic */}
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className={`h-3 w-3 ${style.text}`} />
                  <span className="text-xs text-white/50">
                    Tactic:{" "}
                    <span className="text-white/70">{event.tactic}</span>
                  </span>
                </div>

                {/* Source IP + Timestamp */}
                <div className="flex items-center justify-between text-[11px] text-white/40 font-mono">
                  <span>src: {event.sourceIp}</span>
                  <span>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
