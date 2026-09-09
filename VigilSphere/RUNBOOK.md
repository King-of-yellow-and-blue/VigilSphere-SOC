# TraceGrid RUNBOOK

This document describes how to run the fully integrated TraceGrid application (Phase 4).

## Project Structure

- `./` (Root): The Next.js frontend application.
- `./backend_simulator/`: The Python script that simulates real-time logs and attack events, pushing them to Supabase.
- `app/api/investigate/route.ts`: The Gemini AI endpoint.

## Environment Setup

You need two separate environment files.

1. **Root `.env.local`** (Next.js client-safe values and server secrets)
Create a `.env.local` file in the root directory:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_DEMO_MODE=true # set to false for real Supabase streaming
```

2. **Backend Simulator `.env`** (Python scripts)
Create a `.env` file in the `backend_simulator/` directory. This uses the **service role key** to bypass Row Level Security.
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> [!WARNING]
> NEVER place the Supabase Service Role Key in the root `.env.local` or prefix it with `NEXT_PUBLIC_`.

## Running the Application

### Terminal 1: Next.js Frontend
```bash
# From the project root
npm install
npm run dev
```

### Terminal 2: Backend Simulator
```bash
# From the project root
cd backend_simulator
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
python log_engine.py
```

## Demo Mode

If you encounter network issues or Supabase limits during a demonstration, you can run the application entirely offline.
1. In the root `.env.local`, set `NEXT_PUBLIC_DEMO_MODE=true`
2. Restart the Next.js development server.
3. The dashboard will now use the mock threat engine, and you can simulate attacks using the buttons at the bottom.
