"use client";

import { Brain, AlertCircle, TerminalSquare } from "lucide-react";
import { useEffect, useState } from "react";

interface AiResponse {
  explanation: string;
  predicted_next_move: string;
  remediation_script: string;
}

export function AiInvestigatorPanel({ selectedLog }: { selectedLog?: string | null }) {
  const [data, setData] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedLog) return;
    let isMounted = true;
    
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/investigate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ log_text: selectedLog }),
        });
        
        if (!res.ok) {
          let errorMessage = "Analysis failed.";
          try {
            const errorData = await res.json();
            if (errorData.error) errorMessage = errorData.error;
          } catch {
            errorMessage = `Analysis failed with status: ${res.status}`;
          }
          throw new Error(errorMessage);
        }
        
        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to analyze log.");
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAnalysis();
    return () => { isMounted = false; };
  }, [selectedLog]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-white/50"><Brain className="h-4 w-4" /></span>
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
          AI Investigator
        </h2>
      </div>
      
      {!selectedLog && !isLoading && !data && !error ? (
        <div className="flex-1 min-h-[420px] flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-purple-500/20 rounded-full" />
            <Brain className="relative h-12 w-12 text-purple-400/30" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-white/40 italic">
              Click a flagged log entry to initiate investigation.
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] text-white/20 font-mono uppercase tracking-widest">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400/40 animate-pulse" />
              Standby
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex-1 min-h-[420px] flex flex-col items-center justify-center gap-6">
          <div className="w-full space-y-3">
            <div className="h-4 w-3/4 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-4 w-full rounded-lg bg-white/[0.07] animate-pulse delay-75" />
            <div className="h-4 w-5/6 rounded-lg bg-white/[0.05] animate-pulse delay-150" />
            <div className="h-4 w-2/3 rounded-lg bg-white/[0.07] animate-pulse delay-75" />
            <div className="h-4 w-4/5 rounded-lg bg-white/[0.05] animate-pulse delay-150" />
          </div>
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-purple-500/20 rounded-full" />
            <Brain className="relative h-12 w-12 text-purple-400 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-purple-400 font-medium italic">
              Analyzing threat patterns...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 min-h-[420px] flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-red-400/50" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 min-h-[420px] animate-in slide-in-from-top-2">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest">Explanation</h3>
            <p className="text-sm text-white/90 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10">
              {data.explanation}
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest">Predicted Next Move</h3>
            <div className="flex items-center gap-2 bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
              <AlertCircle className="h-4 w-4 text-purple-400 shrink-0" />
              <p className="text-sm text-purple-200">
                {data.predicted_next_move}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest">Remediation Script</h3>
            <div className="bg-black/50 p-4 rounded-lg border border-white/10 font-mono text-xs overflow-x-auto relative group">
              <TerminalSquare className="absolute top-3 right-3 h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
              <pre className="text-emerald-400">
                <code>{data.remediation_script}</code>
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
