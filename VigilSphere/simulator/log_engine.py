import os
import time
import random
import threading
from dotenv import load_dotenv
from faker import Faker
from supabase import create_client, Client

load_dotenv()

# For hackathon speed, if your .env is failing to load, you can replace these os.environ.get calls 
# with your actual string credentials (e.g. SUPABASE_URL = "https://....")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
fake = Faker()

def generate_normal_log():
    log_types = [
        ("auth", "sshd: Accepted publickey for user {} from {} port {}".format(fake.user_name(), fake.ipv4(), fake.port_number())),
        ("windows", "EventID: 4624 An account was successfully logged on. Account Name: {}".format(fake.user_name())),
        ("apache", "GET /api/v1/health HTTP/1.1 200 - {}".format(fake.ipv4())),
        ("syslog", "kernel: [UFW ALLOW] IN=eth0 OUT= MAC={} SRC={} DST={} LEN=52".format(fake.mac_address(), fake.ipv4(), fake.ipv4()))
    ]
    log_type, log_text = random.choice(log_types)
    
    return {
        "log_text": log_text, # FIXED: Changed from "message" to match Supabase schema
        "log_type": log_type,
        "is_anomaly": False,
        "severity": "LOW"
    }

def normal_log_loop():
    while True:
        log_data = generate_normal_log()
        try:
            supabase.table("security_logs").insert(log_data).execute()
            print(f"[NORMAL] inserted log: {log_data['log_text'][:30]}...")
        except Exception as e:
            print(f"Error inserting normal log: {e}")
            time.sleep(1) # Backoff
        time.sleep(2)

def attack_burst_loop():
    attacks = [
        {
            "name": "Brute Force",
            "log_text": "Failed password for root from {} port {} ssh2 (repeated 50 times)".format(fake.ipv4(), fake.port_number()),
            "log_type": "auth",
            "mitre_tag": "T1110", # ADDED: Required for Next.js UI to render the badge
            "target_node": "USER_ACCOUNTS",
            "severity": "CRITICAL",
            "action_type": "LOCK_ACCOUNT",
            "reason": "Excessive authentication failures detected."
        },
        {
            "name": "Port Scan",
            "log_text": "Multiple connection attempts from {} to ports 22, 80, 443, 3306".format(fake.ipv4()),
            "log_type": "syslog",
            "mitre_tag": "T1046", 
            "target_node": "NETWORK",
            "severity": "HIGH",
            "action_type": "BLOCK_IP",
            "reason": "Horizontal port scanning activity detected."
        },
        {
            "name": "Privilege Escalation",
            "log_text": "User {} executed 'sudo su' with unexpected arguments.".format(fake.user_name()),
            "log_type": "auth",
            "mitre_tag": "T1068",
            "target_node": "SERVICES",
            "severity": "CRITICAL",
            "action_type": "SUSPEND_SESSION",
            "reason": "Suspicious privilege escalation pattern."
        }
    ]
    
    while True:
        # Initial delay before first attack
        time.sleep(30)
        attack = random.choice(attacks)
        
        log_data = {
            "log_text": attack["log_text"], # FIXED: Match Supabase schema
            "log_type": attack["log_type"],
            "is_anomaly": True,
            "mitre_tag": attack["mitre_tag"],
            "target_node": attack["target_node"],
            "severity": attack["severity"]
        }
        
        try:
            response = supabase.table("security_logs").insert(log_data).execute()
            if response.data and len(response.data) > 0:
                inserted_log = response.data[0]
                alert_id = inserted_log["id"]
                
                soar_data = {
                    "alert_id": alert_id,
                    "action_type": attack["action_type"],
                    "target_entity": attack["target_node"],
                    "reason": attack["reason"],
                    "status": "auto_applied"
                }
                
                supabase.table("soar_actions").insert(soar_data).execute()
                print(f"[{attack['name'].upper()}] logged + SOAR: {attack['action_type']} -> {attack['target_node']}")
            else:
                print("Failed to retrieve ID after inserting attack log.")
        except Exception as e:
            print(f"Error during attack simulation: {e}")
            time.sleep(1) # Backoff

if __name__ == "__main__":
    print("Starting VigilSphere Simulator...")
    t1 = threading.Thread(target=normal_log_loop, daemon=True)
    t2 = threading.Thread(target=attack_burst_loop, daemon=True)
    
    t1.start()
    t2.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nSimulator stopped.")