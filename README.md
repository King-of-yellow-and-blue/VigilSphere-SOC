🛡️ VigilSphere
Autonomous SOAR & Predictive 3D Security Operations Center

VigilSphere is a next-generation cybersecurity dashboard that shifts Security Operations from reactive alerting to autonomous containment. Built for the modern enterprise, it replaces flat 2D log streams with a fully interactive 3D spatial environment, real-time threat ingestion, and an autonomous SOAR (Security Orchestration, Automation, and Response) engine.

Team: 4am_Decryptors

Track: Cybersecurity (CS-04)

🚀 Core Features
Autonomous SOAR Engine: VigilSphere doesn't wait for a human. When a critical anomaly (e.g., Brute Force, Port Scan) is detected, the Python engine autonomously applies containment protocols (Lock Account, Block IP) in milliseconds and logs the audit trail for human review.

Spatial Blast-Radius Topology: Live SVG topology mapping visually highlights affected system nodes (Network, File System, User Accounts), allowing analysts to see exactly what part of the infrastructure is compromised at a glance.

Predictive Kill-Chain Forecasting: Integrated with the Google Gemini LLM to translate raw log evidence into plain-English incident reports and forecast the attacker's next lateral movement.

Multi-Vector Ingestion Simulator: A concurrent Python threading engine that streams simulated enterprise logs (Linux auth.log, Windows Event Logs, Apache, and Syslog) directly into the database.

Real-Time Sync & RBAC: Powered by Supabase WebSockets for instant UI updates and secured by Supabase Auth to ensure only Tier-3 SOC Admins can access critical configurations.

🛠️ Tech Stack
Frontend (Interface & Routing)

Next.js (App Router)

Tailwind CSS (Dark Glassmorphism UI)

Spline 3D (Spatial visual rendering)

Lucide React (Iconography)

Backend (Data & Auth)

Supabase PostgreSQL (Real-time database)

Supabase Auth (Client-side session protection)

Google Gemini API (AI Investigator)

Log Ingestion Engine

Python 3

supabase-py & Faker (Multi-thread log simulation)

⚙️ Local Development Setup
VigilSphere runs on a decoupled architecture requiring two separate environments to run simultaneously.

1. Environment Variables
Create a .env.local file in the Next.js root and a .env file in the simulator/ directory. Both require your Supabase credentials:

Code snippet
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# For the Python Engine (.env)
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
2. Boot the Next.js Frontend (Terminal 1)
Bash
npm install
npm run dev
Navigate to http://localhost:3000. You will be intercepted by the Supabase Auth login screen.

3. Boot the SOAR Simulator (Terminal 2)
Open a separate terminal to run the continuous log-generation engine.

Bash
cd simulator
pip install supabase faker python-dotenv
python log_engine.py
The engine will stream normal logs every 2 seconds and inject a targeted MITRE ATT&CK burst every 30 seconds.
