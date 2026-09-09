import os
import time
import random
import uuid
import signal
import sys
import ipaddress
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional, List

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from faker import Faker
from supabase import create_client, Client

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Configuration constants
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project-ref.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-supabase-service-or-anon-key")
TABLE_NAME = os.getenv("SUPABASE_TABLE", "security_logs")

NORMAL_LOG_INTERVAL_SECONDS = float(os.getenv("NORMAL_LOG_INTERVAL_SECONDS", "2"))
ATTACK_BURST_INTERVAL_SECONDS = float(os.getenv("ATTACK_BURST_INTERVAL_SECONDS", "30"))
ATTACK_BURST_SIZE = int(os.getenv("ATTACK_BURST_SIZE", "20"))
ATTACK_BURST_INTRA_DELAY_SECONDS = float(os.getenv("ATTACK_BURST_INTRA_DELAY_SECONDS", "0.15"))

MAX_INSERT_RETRIES = 3
RETRY_BACKOFF_BASE_SECONDS = 1.5
MITRE_BRUTE_FORCE_TAG = "T1110"

# IETF-reserved documentation/example address blocks (RFC 5737 for IPv4, RFC 3849 for IPv6)
DOCUMENTATION_CIDRS = [
    "192.0.2.0/24",     # TEST-NET-1
    "198.51.100.0/24",  # TEST-NET-2
    "203.0.113.0/24",   # TEST-NET-3
    "2001:db8::/32"     # IPv6 documentation range
]

faker = Faker()

@dataclass
class LogRow:
    id: str
    timestamp: str
    source_ip: str
    log_type: str
    message: str
    is_anomaly: bool
    mitre_tag: Optional[str]

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "source_ip": self.source_ip,
            "log_type": self.log_type,
            "message": self.message,
            "is_anomaly": self.is_anomaly,
            "mitre_tag": self.mitre_tag,
        }

def build_supabase_client() -> Client:
    if SUPABASE_URL == "https://your-project-ref.supabase.co" or SUPABASE_KEY == "your-supabase-service-or-anon-key":
        logger.warning("Supabase credentials are set to placeholders. Please configure real credentials.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_row(client: Client, row: LogRow):
    for attempt in range(1, MAX_INSERT_RETRIES + 1):
        try:
            client.table(TABLE_NAME).insert(row.to_dict()).execute()
            return
        except Exception as e:
            logger.error(f"Failed to insert row (attempt {attempt}/{MAX_INSERT_RETRIES}): {e}")
            if attempt < MAX_INSERT_RETRIES:
                time.sleep(RETRY_BACKOFF_BASE_SECONDS * attempt)
    logger.error("Max retries reached. Failed to insert row.")

def generate_normal_log() -> LogRow:
    log_type = random.choice(["ssh", "nginx"])
    timestamp_iso = datetime.now(timezone.utc).isoformat()
    row_id = str(uuid.uuid4())
    
    if log_type == "ssh":
        user = faker.user_name()
        ip = faker.ipv4_public()
        port = random.randint(1024, 65535)
        message = f"Accepted password for {user} from {ip} port {port} ssh2"
        source_ip = ip
    else:
        ip = faker.ipv4_public()
        user_agent = faker.user_agent()
        uri = faker.uri_path()
        status_code = random.choices([200, 301, 404, 500], weights=[80, 5, 10, 5])[0]
        # Approximate common log format timestamp
        timestamp_clf = datetime.now(timezone.utc).strftime("%d/%b/%Y:%H:%M:%S %z")
        if not timestamp_clf.endswith("00"):
            timestamp_clf += "+0000" # fallback if %z is empty string in some envs
        message = f'{ip} - - [{timestamp_clf}] "GET {uri} HTTP/1.1" {status_code} {random.randint(100, 5000)} "-" "{user_agent}"'
        source_ip = ip

    return LogRow(
        id=row_id,
        timestamp=timestamp_iso,
        source_ip=source_ip,
        log_type=log_type,
        message=message,
        is_anomaly=False,
        mitre_tag=None
    )

def generate_attack_burst(size: int = ATTACK_BURST_SIZE) -> List[LogRow]:
    cidr_str = random.choice(DOCUMENTATION_CIDRS)
    network = ipaddress.ip_network(cidr_str)
    
    num_hosts = network.num_addresses
    random_host_idx = random.randint(0, num_hosts - 1)
    attacker_ip = str(network[random_host_idx])
    
    rows = []
    for _ in range(size):
        port = random.randint(1024, 65535)
        message = f"Failed password for root from {attacker_ip} port {port} ssh2"
        rows.append(LogRow(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc).isoformat(),
            source_ip=attacker_ip,
            log_type="ssh",
            message=message,
            is_anomaly=True,
            mitre_tag=MITRE_BRUTE_FORCE_TAG
        ))
    return rows

_shutdown_requested = False

def handle_shutdown(signum, frame):
    global _shutdown_requested
    logger.info("Shutdown requested. Will exit cleanly after current cycle finishes.")
    _shutdown_requested = True

def main():
    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)

    logger.info(f"Starting Log Engine. Normal interval: {NORMAL_LOG_INTERVAL_SECONDS}s, Burst interval: {ATTACK_BURST_INTERVAL_SECONDS}s")
    client = build_supabase_client()

    last_normal_ts = time.monotonic()
    last_burst_ts = time.monotonic()

    while not _shutdown_requested:
        now = time.monotonic()
        
        if (now - last_normal_ts) >= NORMAL_LOG_INTERVAL_SECONDS:
            row = generate_normal_log()
            insert_row(client, row)
            logger.info(f"Inserted normal log: {row.log_type} from {row.source_ip}")
            last_normal_ts = now

        if (now - last_burst_ts) >= ATTACK_BURST_INTERVAL_SECONDS:
            logger.warning("Attack burst is starting!")
            burst_rows = generate_attack_burst()
            if burst_rows:
                attacker_ip = burst_rows[0].source_ip
                for b_row in burst_rows:
                    if _shutdown_requested:
                        break # Stop mid-burst if shutdown requested
                    insert_row(client, b_row)
                    time.sleep(ATTACK_BURST_INTRA_DELAY_SECONDS)
                logger.warning(f"Attack burst finished. Inserted {len(burst_rows)} rows from attacker IP: {attacker_ip}")
            last_burst_ts = now
            
        time.sleep(0.1)

    logger.info("Clean shutdown complete.")
    sys.exit(0)

if __name__ == "__main__":
    main()
