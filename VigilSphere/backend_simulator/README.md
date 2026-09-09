# Python Log Simulator & Threat Detector

A Python script that simulates realistic server traffic (SSH and Nginx logs) and periodic brute-force attack patterns, writing them directly into a Supabase table.

## Setup Instructions

1. Copy the example environment variables file and paste in your real Supabase URL and Key:
```bash
cp .env.example .env
```
2. Install the required dependencies:
```bash
pip install -r requirements.txt
```
3. In the Supabase SQL editor, run `schema.sql` once to create the target table.
4. Run the simulation:
```bash
python log_engine.py
```

The script runs indefinitely. Press `Ctrl+C` to stop it cleanly.
