import { createClient } from "@supabase/supabase-js";
import { MITRE_CATALOG } from "./mitreCatalog";
import type { ThreatSource, LogLine, ThreatEvent } from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const seenIds = new Set<string>(); // dedupe guard

function mapRowToLogLine(row: Record<string, unknown>): LogLine {
  return {
    id: row.id as string,
    timestamp: (row.timestamp || row.created_at) as string, // Use timestamp based on schema
    raw: row.message as string, // Use message based on schema
    flagged: row.is_anomaly === true,
  };
}

function mapRowToThreatEvent(row: Record<string, unknown>): ThreatEvent | null {
  const catalogEntry = MITRE_CATALOG[row.mitre_tag as keyof typeof MITRE_CATALOG];
  if (!catalogEntry) return null;
  return {
    id: row.id,
    timestamp: row.timestamp || row.created_at, // Use timestamp
    sourceIp: row.source_ip,
    techniqueId: catalogEntry.id,
    techniqueName: catalogEntry.name,
    tactic: catalogEntry.tactic,
    severity: row.severity ?? "high",
    rawLogLine: row.message, // Use message
  };
}

export const supabaseThreatSource: ThreatSource = {
  onLogLine(callback) {
    const channel = supabase
      .channel("security_logs_lines")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_logs" },
        (payload) => callback(mapRowToLogLine(payload.new))
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },

  onThreatEvent(callback) {
    const channel = supabase
      .channel("security_logs_threats")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_logs" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (!row.is_anomaly || seenIds.has(row.id as string)) return; // dedupe: only fire on genuinely new anomalies
          seenIds.add(row.id as string);
          const event = mapRowToThreatEvent(row);
          if (event) callback(event);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },

  triggerAttack() {
    // No-op in production — real attacks originate from backend_simulator/.
    // Left as a no-op (not deleted) so the interface stays satisfied and
    // SimulateAttackButton doesn't crash if rendered in DEMO_MODE.
  },
};
