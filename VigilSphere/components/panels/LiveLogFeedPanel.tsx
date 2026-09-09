"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "lucide-react";
import type { LogLine, ThreatSource } from "@/lib/types";


const MAX_LINES = 30;

export function LiveLogFeedPanel({
  threatSource,
  onLogClick,
}: {
  threatSource: ThreatSource;
  onLogClick?: (logText: string) => void;
}) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = threatSource.onLogLine((line) => {
      setLines((prev) => [line, ...prev].slice(0, MAX_LINES));
    });
    return unsub;
  }, [threatSource]);

  // Auto-scroll to top on new flagged line
  useEffect(() => {
    if (lines.length > 0 && lines[0].flagged && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [lines]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-white/50"><Terminal className="h-4 w-4" /></span>
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
          Live Log Feed
        </h2>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs leading-relaxed custom-scrollbar min-h-[420px]"
      >
        {lines.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">
            Waiting for log stream…
          </div>
        ) : (
          lines.map((line) => (
            <div
              key={line.id}
              onClick={() => {
                if (line.flagged && onLogClick) {
                  onLogClick(line.raw);
                }
              }}
              className={`py-1 px-2 rounded transition-colors duration-300 ${
                line.flagged
                  ? "text-red-400 bg-red-500/10 border-l-2 border-red-500/50 cursor-pointer hover:bg-red-500/20"
                  : "text-emerald-300/60 hover:bg-white/5"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {line.flagged && (
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                )}
                <span className="text-white/25 mr-2 select-none">
                  {new Date(line.timestamp).toLocaleTimeString()}
                </span>
                {line.raw}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
