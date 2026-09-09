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
  onLogLine(callback: (line: LogLine) => void): () => void;         // returns unsubscribe fn
  onThreatEvent(callback: (event: ThreatEvent) => void): () => void;
  triggerAttack(kind: "brute_force" | "port_scan"): void;
}
