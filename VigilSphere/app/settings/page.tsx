"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { User, LogOut, Shield, ShieldCheck, Mail } from "lucide-react";

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setEmail(session.user.email ?? null);
      setDisplayName(session.user.user_metadata?.full_name || "");
      setLoading(false);
    };

    fetchSession();
  }, [router]);

  const handleUpdateProfile = async () => {
    setSaving(true);
    await supabase.auth.updateUser({
      data: { full_name: displayName }
    });
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex-1 h-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-black/95 overflow-y-auto p-8 relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-900/10 blur-[100px] pointer-events-none rounded-full" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/50 border border-cyan-900/50 flex items-center justify-center">
            <User className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-wide">Analyst Profile & Settings</h1>
            <p className="text-cyan-500/60 font-mono text-sm mt-1">Manage your identity and security preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Section */}
          <div className="bg-black/40 backdrop-blur-md border border-cyan-900/40 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-cyan-300 mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 opacity-70" /> Account Details
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-cyan-500/70 mb-2 tracking-wider">EMAIL ADDRESS (READ-ONLY)</label>
                <input 
                  type="text" 
                  value={email || ""} 
                  disabled 
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-400 font-mono cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-xs font-mono text-cyan-500/70 mb-2 tracking-wider">DISPLAY NAME</label>
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-black/60 border border-cyan-900/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="e.g. Commander Shepard"
                />
              </div>

              <button 
                onClick={handleUpdateProfile}
                disabled={saving}
                className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 rounded-lg py-3 font-semibold tracking-wide transition-all duration-300 flex justify-center items-center h-12"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-cyan-300/30 border-t-cyan-300 rounded-full animate-spin" />
                ) : (
                  "SAVE CHANGES"
                )}
              </button>
            </div>
          </div>

          {/* Security & Danger Zone */}
          <div className="space-y-8">
            <div className="bg-black/40 backdrop-blur-md border border-cyan-900/40 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-cyan-300 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 opacity-70" /> Security Preferences
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 mt-1">Require a hardware key or TOTP code.</p>
                  </div>
                  <button 
                    onClick={() => setTwoFactor(!twoFactor)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${twoFactor ? 'bg-cyan-500' : 'bg-gray-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${twoFactor ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Strict IP Whitelisting</h3>
                    <p className="text-sm text-gray-500 mt-1">Restrict dashboard access to SOC subnets.</p>
                  </div>
                  <button 
                    onClick={() => setIpWhitelist(!ipWhitelist)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${ipWhitelist ? 'bg-cyan-500' : 'bg-gray-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${ipWhitelist ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-red-400 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 opacity-70" /> Access Control
              </h2>
              <p className="text-sm text-gray-400 mb-6">Instantly revoke this session and sign out of the SOC dashboard.</p>
              
              <button 
                onClick={handleSignOut}
                className="w-full bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-300 rounded-lg py-3 font-bold tracking-widest transition-all duration-300 flex justify-center items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                TERMINATE SESSION
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
