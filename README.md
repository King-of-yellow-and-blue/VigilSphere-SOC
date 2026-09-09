# 🛡️ VigilSphere
**Autonomous SOAR & Predictive 3D Security Operations Center**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)

VigilSphere shifts Security Operations from reactive alerting to autonomous containment. Built for the modern enterprise, it replaces flat 2D log streams with a fully interactive 3D spatial environment, real-time threat ingestion, and an autonomous SOAR engine.

**Team:** 4am_Decryptors | **Track:** Cybersecurity (CS-04)

---

## 🚀 Core Features

* **Autonomous SOAR Engine:** Detects critical anomalies (Brute Force, Port Scan) and autonomously applies containment protocols (Lock Account, Block IP) in milliseconds, leaving a clean audit trail.
* **Spatial Blast-Radius Topology:** Live SVG mapping highlights affected system nodes (Network, File System, User Accounts) to instantly visualize the compromised perimeter.
* **Predictive Kill-Chain Forecasting:** Uses the Google Gemini LLM to translate raw log evidence into incident reports and forecast the attacker's next lateral movement.
* **Multi-Vector Ingestion Simulator:** A concurrent Python engine streaming simulated Linux `auth.log`, Windows Event Logs, Apache, and Syslogs directly into the database.
* **Real-Time Sync & RBAC:** Supabase WebSockets drive instant UI updates, secured by Supabase Auth to ensure only Tier-3 SOC Admins can access configurations.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | Next.js (App Router), Tailwind CSS, Spline 3D, Lucide React |
| **Backend** | Supabase (PostgreSQL, Auth, Real-time WebSockets) |
| **Intelligence** | Google Gemini API (LLM Investigation) |
| **Log Engine** | Python 3, `supabase-py`, `Faker` |

---

## ⚙️ Local Development Setup

VigilSphere uses a decoupled architecture. You must run the frontend and the log simulator simultaneously in two separate terminals.

### 1. Environment Variables
Create `.env.local` (Next.js root) and `.env` (`simulator/` folder) with your Supabase credentials:

```env
# Next.js Root (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Python Engine (simulator/.env)
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Boot the Next.js Frontend (Terminal 1)
```bash
npm install
npm run dev
```
*Navigate to `http://localhost:3000` to hit the Supabase Auth login screen.*

### 3. Boot the SOAR Simulator (Terminal 2)
```bash
cd simulator
pip install supabase faker python-dotenv
python log_engine.py
```
*The engine streams normal logs every 2 seconds and injects a targeted MITRE ATT&CK burst every 30 seconds.*
