"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AlertRow {
  id: string;
  created_at: string;
  log_type: string;
  message: string;
  severity: string;
  soar_actions: { status: string }[];
}

export default function TriagePage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('security_logs')
          .select('*, soar_actions(status)')
          .eq('is_anomaly', true)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (data) {
          setAlerts(data as AlertRow[]);
        }
      } catch (err: unknown) {
        console.error("Failed to load logs", err);
      }
      setLoading(false);
    };
    
    fetchAlerts();
  }, []);

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
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 flex items-center gap-3">
              <AlertTriangle className="text-red-500" />
              Triage Inbox
            </h1>
            <p className="text-gray-400 mt-2">Historical anomalous events and automated containment actions.</p>
          </div>
          <button 
            disabled 
            title="PDF reporting coming soon"
            className="bg-cyan-900/40 border border-cyan-800 text-cyan-400 px-4 py-2 rounded-lg flex items-center gap-2 opacity-50 cursor-not-allowed hover:bg-cyan-900/60 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Generate PDF Report
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-cyan-500 gap-4">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p>Loading incident data...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-500 bg-gray-900/20 border border-gray-800 rounded-xl">
            <ShieldCheck className="w-16 h-16 text-green-500 mb-4 opacity-50" />
            <h3 className="text-xl text-gray-300">No alerts yet</h3>
            <p className="mt-2 text-sm">Your perimeter is secure.</p>
          </div>
        ) : (
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800/60 border-b border-gray-700 text-gray-300 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Timestamp</th>
                  <th className="p-4 font-semibold">Log Source</th>
                  <th className="p-4 font-semibold">Incident Type</th>
                  <th className="p-4 font-semibold">Severity</th>
                  <th className="p-4 font-semibold">SOAR Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {alerts.map((alert) => {
                  const status = alert.soar_actions?.[0]?.status || 'pending';
                  return (
                    <tr key={alert.id} className="hover:bg-gray-800/30 transition-colors group">
                      <td className="p-4 text-gray-400 text-sm whitespace-nowrap flex items-center gap-2">
                        <Clock className="w-3 h-3 opacity-50" />
                        {new Date(alert.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700">
                          {alert.log_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-200">
                        <div className="truncate max-w-xs" title={alert.message}>
                          {alert.message}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          alert.severity === 'CRITICAL' ? 'bg-red-950/50 text-red-400 border border-red-900' :
                          alert.severity === 'HIGH' ? 'bg-orange-950/50 text-orange-400 border border-orange-900' :
                          'bg-yellow-950/50 text-yellow-400 border border-yellow-900'
                        }`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          status === 'confirmed' ? 'bg-green-900/30 text-green-400 border border-green-800' :
                          status === 'rolled_back' ? 'bg-orange-900/30 text-orange-400 border border-orange-800' :
                          status === 'auto_applied' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800' :
                          'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                          {status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
