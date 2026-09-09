import { ThreatSource, LogLine, ThreatEvent, Severity } from "./types";
import { MITRE_CATALOG } from "./mitreCatalog";

// ── helpers ───────────────────────────────────────────────────────────
let idCounter = 0;
function uid(): string {
  return `evt-${Date.now()}-${++idCounter}`;
}

function isoNow(): string {
  return new Date().toISOString();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomIp(): string {
  return `${randomInt(10, 192)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
}

const BENIGN_TEMPLATES = [
  (_: string) =>
    `sshd[${randomInt(1000, 9999)}]: Accepted password for user${randomInt(1, 8)} from ${_} port ${randomInt(49152, 65535)} ssh2`,
  (_: string) =>
    `sshd[${randomInt(1000, 9999)}]: Disconnected from user${randomInt(1, 8)} ${_} port ${randomInt(49152, 65535)}`,
  () =>
    `systemd[1]: Started Session ${randomInt(100, 999)} of user user${randomInt(1, 8)}.`,
  () =>
    `CRON[${randomInt(1000, 9999)}]: (root) CMD (/usr/lib/sa/sa1 1 1)`,
  () =>
    `kernel: [${randomInt(10000, 99999)}.${randomInt(100, 999)}] audit: type=1400 audit(${Date.now()}): apparmor="ALLOWED" operation="open" profile="snap.lxd.lxc"`,
  () =>
    `sshd[${randomInt(1000, 9999)}]: pam_unix(sshd:session): session opened for user admin(uid=1000) by (uid=0)`,
];

// ── MockThreatSource ──────────────────────────────────────────────────
class MockThreatSource implements ThreatSource {
  private logListeners: Set<(line: LogLine) => void> = new Set();
  private threatListeners: Set<(event: ThreatEvent) => void> = new Set();
  private idleTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.startIdleStream();
  }

  // ── subscriptions ──
  onLogLine(callback: (line: LogLine) => void): () => void {
    this.logListeners.add(callback);
    return () => {
      this.logListeners.delete(callback);
    };
  }

  onThreatEvent(callback: (event: ThreatEvent) => void): () => void {
    this.threatListeners.add(callback);
    return () => {
      this.threatListeners.delete(callback);
    };
  }

  // ── emitters ──
  private emitLog(line: LogLine) {
    this.logListeners.forEach((cb) => cb(line));
  }

  private emitThreat(event: ThreatEvent) {
    this.threatListeners.forEach((cb) => cb(event));
  }

  // ── idle background stream (1 benign line every 2-4 s) ──
  private startIdleStream() {
    const scheduleNext = () => {
      const delay = randomInt(2000, 4000);
      this.idleTimer = setTimeout(() => {
        const ip = randomIp();
        const template =
          BENIGN_TEMPLATES[randomInt(0, BENIGN_TEMPLATES.length - 1)];
        this.emitLog({
          id: uid(),
          timestamp: isoNow(),
          raw: template(ip),
          flagged: false,
        });
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  // ── attack simulation ──
  triggerAttack(kind: "brute_force" | "port_scan"): void {
    if (kind === "brute_force") {
      this.simulateBruteForce();
    } else {
      this.simulatePortScan();
    }
  }

  private simulateBruteForce() {
    const attackerIp = randomIp();
    const catalog = MITRE_CATALOG.brute_force;
    const users = ["root", "admin", "deploy", "ubuntu", "postgres", "www-data", "git", "jenkins"];

    // Emit ~8 flagged log lines 150 ms apart
    users.forEach((user, i) => {
      setTimeout(() => {
        this.emitLog({
          id: uid(),
          timestamp: isoNow(),
          raw: `sshd[${randomInt(1000, 9999)}]: Failed password for ${user} from ${attackerIp} port ${randomInt(49152, 65535)} ssh2`,
          flagged: true,
        });

        // After the last log line, emit the ThreatEvent
        if (i === users.length - 1) {
          setTimeout(() => {
            this.emitThreat({
              id: uid(),
              timestamp: isoNow(),
              sourceIp: attackerIp,
              destPort: 22,
              techniqueId: catalog.id,
              techniqueName: catalog.name,
              tactic: catalog.tactic,
              severity: "high" as Severity,
              rawLogLine: `sshd: ${users.length} failed login attempts from ${attackerIp}`,
            });
          }, 100);
        }
      }, i * 150);
    });
  }

  private simulatePortScan() {
    const attackerIp = randomIp();
    const catalog = MITRE_CATALOG.port_scan;
    const ports = [21, 22, 23, 25, 80, 110, 143, 443, 3306, 8080];

    // Emit ~10 flagged log lines 150 ms apart
    ports.forEach((port, i) => {
      setTimeout(() => {
        this.emitLog({
          id: uid(),
          timestamp: isoNow(),
          raw: `kernel: [${randomInt(10000, 99999)}.${randomInt(100, 999)}] IN=eth0 OUT= SRC=${attackerIp} DST=10.0.0.1 PROTO=TCP SPT=${randomInt(49152, 65535)} DPT=${port} SYN`,
          flagged: true,
        });

        // After the last log line, emit the ThreatEvent
        if (i === ports.length - 1) {
          setTimeout(() => {
            this.emitThreat({
              id: uid(),
              timestamp: isoNow(),
              sourceIp: attackerIp,
              techniqueId: catalog.id,
              techniqueName: catalog.name,
              tactic: catalog.tactic,
              severity: "medium" as Severity,
              rawLogLine: `iptables: ${ports.length} sequential connection attempts from ${attackerIp}`,
            });
          }, 100);
        }
      }, i * 150);
    });
  }
}

// Singleton export — only page.tsx should import this
export const mockThreatSource: ThreatSource = new MockThreatSource();
