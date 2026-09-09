"use client";

import React, { useEffect, useState } from 'react';
import { Cloud, Server, Shield, Network, Zap, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function IntegrationsPage() {
  const integrations = [
    { name: 'AWS CloudTrail', status: 'ACTIVE', eps: '2,100 eps', icon: Cloud, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    { name: 'Windows Server', status: 'ACTIVE', eps: '1,450 eps', icon: Server, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { name: 'Nginx Access Logs', status: 'ACTIVE', eps: '8,900 eps', icon: Network, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    { name: 'Syslog (Core Router)', status: 'ACTIVE', eps: '5,300 eps', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    { name: 'CrowdStrike Falcon', status: 'SYNCING', eps: '450 eps', icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    { name: 'Palo Alto Panorama', status: 'ACTIVE', eps: '12,000 eps', icon: Lock, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  ];

  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  if (authChecking) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black text-white p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Data Sources & Integrations
          </h1>
          <p className="text-gray-400 mt-2">Manage your ingestion pipelines and connected security controls.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, idx) => (
            <div 
              key={idx}
              className={`bg-black/60 backdrop-blur-md border ${integration.border} rounded-xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-gray-900/80 transition-all cursor-pointer group`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-lg ${integration.bg} border ${integration.border}`}>
                  <integration.icon className={`w-8 h-8 ${integration.color}`} />
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${
                  integration.status === 'ACTIVE' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-yellow-950/50 text-yellow-400 border border-yellow-900'
                }`}>
                  {integration.status}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-100 mb-1">{integration.name}</h3>
              
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Ingestion Rate</span>
                <span className="text-sm font-mono text-cyan-400">{integration.eps}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
