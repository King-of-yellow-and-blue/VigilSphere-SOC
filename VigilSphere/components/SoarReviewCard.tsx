"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, RotateCcw, ShieldAlert } from 'lucide-react';

interface SoarReviewCardProps {
  id: string;
  action_type: string;
  target_entity: string;
  reason: string;
  status: string;
}

export default function SoarReviewCard({ id, action_type, target_entity, reason, status }: SoarReviewCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('soar_actions')
        .update({ status: newStatus })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to update action");
    } finally {
      setLoading(false);
    }
  };

  const isResolved = status !== 'auto_applied';

  return (
    <div className="w-full max-w-md bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
      {/* Decorative top border glow */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-red-500/20 p-2 rounded-lg border border-red-500/50">
          <ShieldAlert className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h3 className="text-red-400 font-bold text-sm tracking-widest uppercase">Autonomous Containment Applied</h3>
          <p className="text-gray-400 text-xs mt-1">Status: <span className={`font-semibold ${status === 'confirmed' ? 'text-green-400' : status === 'rolled_back' ? 'text-orange-400' : 'text-yellow-400'}`}>{status.replace('_', ' ').toUpperCase()}</span></p>
        </div>
      </div>

      <div className="space-y-3 mb-6 bg-cyan-950/20 p-4 rounded-lg border border-cyan-900/50">
        <div className="flex justify-between items-center border-b border-cyan-900/30 pb-2">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Action</span>
          <span className="text-cyan-300 font-mono text-sm">{action_type}</span>
        </div>
        <div className="flex justify-between items-center border-b border-cyan-900/30 pb-2">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Target</span>
          <span className="text-cyan-300 font-mono text-sm">{target_entity}</span>
        </div>
        <div>
          <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">Reason</span>
          <span className="text-gray-300 text-sm leading-relaxed">{reason}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/30 p-2 rounded mb-4 border border-red-900">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => updateStatus('confirmed')}
          disabled={loading || isResolved}
          className="flex-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          Confirm Action
        </button>
        <button
          onClick={() => updateStatus('rolled_back')}
          disabled={loading || isResolved}
          className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Rollback
        </button>
      </div>
    </div>
  );
}
