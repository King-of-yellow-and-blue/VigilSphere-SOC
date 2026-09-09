"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, Mail, Shield, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (isSignUp: boolean) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: authError } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw authError;

      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden isolate">
      {/* Background styling matching VigilSphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#000_100%)] z-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/20 blur-[120px] rounded-full z-0" />

      <div className="w-full max-w-md p-8 bg-black/60 backdrop-blur-xl border border-cyan-900/50 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] z-20">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center mb-4 shadow-[inset_0_0_20px_rgba(34,211,238,0.2)]">
            <Shield className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-wider">
            VIGILSPHERE
          </h1>
          <p className="text-cyan-600/70 text-xs tracking-[0.2em] mt-2 uppercase font-mono">
            Secure Access Portal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="text-xs font-mono text-cyan-400/70 tracking-wider">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500/50" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-cyan-900/50 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                placeholder="analyst@vigilsphere.io"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-cyan-400/70 tracking-wider">PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500/50" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-cyan-900/50 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => handleAuth(false)}
              disabled={loading}
              className="flex-1 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 rounded-lg py-3 font-semibold tracking-wide transition-all duration-300 disabled:opacity-50"
            >
              SIGN IN
            </button>
            <button
              onClick={() => handleAuth(true)}
              disabled={loading}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg py-3 font-semibold tracking-wide transition-all duration-300 disabled:opacity-50"
            >
              CREATE ACCOUNT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
