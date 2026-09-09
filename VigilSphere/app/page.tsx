"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';
import BlastRadius from '@/components/BlastRadius';
import SoarReviewCard from '@/components/SoarReviewCard';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SecurityLog {
  id: string;
  created_at: string;
  message: string;
  log_type: string;
  is_anomaly: boolean;
  target_node: string | null;
  severity: string;
}

interface SoarAction {
  id: string;
  alert_id: string;
  action_type: string;
  target_entity: string;
  reason: string;
  status: string;
}

export default function Dashboard() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [soarAction, setSoarAction] = useState<SoarAction | null>(null);
  const [isThreatDetected, setIsThreatDetected] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const router = useRouter();

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
  
  const seenAnomalies = useRef<Set<string>>(new Set());

  const fetchInitialData = useCallback(async () => {
    const { data: logData } = await supabase
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);
    if (logData) setLogs(logData);

    const { data: soarData } = await supabase
      .from('soar_actions')
      .select('*')
      .order('taken_at', { ascending: false })
      .limit(1);
    if (soarData && soarData.length > 0) {
      setSoarAction(soarData[0]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInitialData();

    // Supabase Realtime subscriptions
    const logSub = supabase
      .channel('public:security_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_logs' }, payload => {
        const newLog = payload.new as SecurityLog;
        setLogs(prev => [newLog, ...prev].slice(0, 15));
        
        if (newLog.is_anomaly && !seenAnomalies.current.has(newLog.id)) {
          seenAnomalies.current.add(newLog.id);
          setIsThreatDetected(true);
          setActiveNode(newLog.target_node);
          
          // Clear alert after 15 seconds
          setTimeout(() => {
            setIsThreatDetected(false);
            setActiveNode(null);
          }, 15000);
        }
      })
      .subscribe();

    const soarSub = supabase
      .channel('public:soar_actions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'soar_actions' }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setSoarAction(payload.new as SoarAction);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(logSub);
      supabase.removeChannel(soarSub);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authChecking) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white flex isolate">
      <Script type="module" src="https://unpkg.com/@splinetool/viewer@1.9.3/build/spline-viewer.js" strategy="lazyOnload" />
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        {/* @ts-expect-error - Custom Web Component missing types */}
        <spline-viewer url="https://prod.spline.design/prMqvXvATuupxYv8/scene.splinecode" />
      </div>

      {/* Red Alert Overlay */}
      {isThreatDetected && (
        <div className="absolute inset-0 z-10 pointer-events-none mix-blend-screen transition-opacity duration-1000 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(239,68,68,0.3)_100%)] shadow-[inset_0_0_150px_rgba(220,38,38,0.8)] animate-pulse" />
      )}

      {/* Foreground UI Layer */}
      <div className="relative z-20 w-full h-full flex justify-between p-6 pointer-events-none">
        
        {/* Left Panel: Live Log Feed */}
        <div className="w-96 flex flex-col gap-4 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-md border border-cyan-900/50 rounded-xl p-4 h-full overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col">
            <h2 className="text-cyan-400 font-semibold mb-4 tracking-wider flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              LIVE LOG FEED
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
              {logs.map((log, index) => (
                <div key={`${log.id}-${index}`} className={`p-3 rounded-lg border text-xs font-mono transition-colors ${
                  log.is_anomaly 
                    ? 'bg-red-950/30 border-red-900/50 text-red-200' 
                    : 'bg-cyan-950/20 border-cyan-900/30 text-cyan-200'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="opacity-50">{new Date(log.created_at).toLocaleTimeString()}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.severity === 'CRITICAL' ? 'bg-red-500 text-white' : 
                      log.severity === 'HIGH' ? 'bg-orange-500 text-white' : 'bg-cyan-800 text-cyan-100'
                    }`}>
                      {log.severity}
                    </span>
                  </div>
                  <div className="break-all">{log.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel (Transparent for 3D model) */}
        <div className="flex-1 flex items-start justify-center pt-8">
          {isThreatDetected && (
            <div className="bg-red-950/80 backdrop-blur border border-red-500 rounded-full px-6 py-3 flex items-center gap-3 animate-bounce shadow-[0_0_30px_rgba(239,68,68,0.6)]">
              <AlertCircle className="text-red-500 w-6 h-6 animate-pulse" />
              <span className="text-red-400 font-bold tracking-widest text-lg">CRITICAL THREAT DETECTED</span>
            </div>
          )}
        </div>

        {/* Right Panel: Blast Radius & SOAR */}
        <div className="w-[28rem] flex flex-col gap-6 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-md border border-cyan-900/50 rounded-xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <BlastRadius activeNode={activeNode} />
          </div>
          
          {soarAction && (
             <div className="transition-all duration-500">
                <SoarReviewCard 
                  id={soarAction.id}
                  action_type={soarAction.action_type}
                  target_entity={soarAction.target_entity}
                  reason={soarAction.reason}
                  status={soarAction.status}
                />
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
