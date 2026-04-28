'use client';

import React, { useState, useEffect } from 'react';
import { EntitySwitcher } from '@/components/layout/EntitySwitcher';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { RealTimePipeline } from '@/components/dashboard/RealTimePipeline';

export default function CommandCentre() {
  const [orgId, setOrgId] = useState('PRIMARY');
  const [stats, setStats] = useState([
    { label: 'Pipeline Value', value: '...', color: 'text-blue-500' },
    { label: 'Total Spend', value: '...', color: 'text-amber-500' },
    { label: 'Cash On Hand', value: '...', color: 'text-emerald-500' },
    { label: 'Audit Integrity', value: 'SECURE', color: 'text-white' }
  ]);

  // Real-time stats fetching based on entity
  useEffect(() => {
    async function fetchStats() {
      const res = await fetch(`/api/analytics/health-score?orgId=${orgId}`);
      const data = await res.json();
      if (data.score) {
        setStats([
          { label: 'Health Score', value: data.score.toString(), color: 'text-blue-500' },
          { label: 'Runway', value: `${data.metrics.runwayMonths} mo`, color: 'text-amber-500' },
          { label: 'Rec Rate', value: data.metrics.reconciliationRate, color: 'text-emerald-500' },
          { label: 'Audit Status', value: 'VERIFIED', color: 'text-white' }
        ]);
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, [orgId]);

  return (
    <main className="min-h-screen p-6 space-y-6 bg-black text-zinc-300 selection:bg-blue-500/30">
      {/* MULTI-ENTITY HEADER */}
      <div className="flex justify-between items-center mb-6">
        <EntitySwitcher currentOrgId={orgId} onSwitch={setOrgId} />
        <a
          href="/crm"
          className="terminal-border px-4 py-2 bg-blue-500/10 text-blue-500 font-mono text-[10px] hover:bg-blue-500 hover:text-black transition-all uppercase"
        >
          Open CRM Pipeline
        </a>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="terminal-border p-4 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors cursor-crosshair">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{s.label}</div>
            <div className={`text-2xl font-bold mono-num mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-6 h-[calc(100vh-250px)]">
        {/* LEFT: ACTIVITY FEED (BIFROST STREAM) */}
        <div className="col-span-1 terminal-border bg-black overflow-hidden flex flex-col">
          <div className="p-2 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tighter">Live Ledger Stream</span>
            <div className="flex gap-1">
               <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
               <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse delay-75" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ActivityFeed orgId={orgId} />
          </div>
        </div>

        {/* CENTRE: PIPELINE / SPENDOS GRID */}
        <div className="col-span-3 terminal-border bg-black overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(24,24,27,1)_0%,rgba(0,0,0,1)_100%)] opacity-50 pointer-events-none" />
          <div className="relative h-full p-4 overflow-y-auto custom-scrollbar">
            {orgId === 'PRIMARY' ? (
              <RealTimePipeline initialOpps={[]} orgId={orgId} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                <div className="text-4xl">🏛️</div>
                <div className="font-mono text-sm uppercase tracking-[0.2em]">Entity: {orgId} Visualizer Loading...</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER AUDIT BAR */}
      <div className="fixed bottom-0 left-0 right-0 h-8 bg-zinc-900 border-t border-zinc-800 px-6 flex items-center justify-between text-[10px] font-mono text-zinc-500">
         <div className="flex gap-4">
            <span>OS_STATUS: NOMINAL</span>
            <span>ENCRYPTION: AES-256-GCM</span>
            <span className="text-emerald-500">LEDGER: SYNCHRONIZED</span>
         </div>
         <div className="flex gap-4">
            <span>SESSION: 0x8F2...3A1</span>
            <span className="text-zinc-400">© 2024 COLLECTIVE KITTY</span>
         </div>
      </div>
    </main>
  );
}
