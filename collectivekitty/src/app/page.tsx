import React from 'react';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 font-mono">
      <div className="max-w-2xl w-full space-y-8 text-center border border-zinc-800 p-12 bg-zinc-900/20">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter">COLLECTIVE SpendOS</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-widest">Multi-Entity Wealth & ERP Engine</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/app"
            className="p-4 border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500 hover:text-black transition-all group"
          >
            <div className="text-xl font-bold">WAR ROOM</div>
            <div className="text-[10px] opacity-50 uppercase mt-1">Command Centre & Ledger</div>
          </a>

          <a
            href="/crm"
            className="p-4 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500 hover:text-black transition-all group"
          >
            <div className="text-xl font-bold">CRM</div>
            <div className="text-[10px] opacity-50 uppercase mt-1">Pipeline & Materialization</div>
          </a>
        </div>

        <div className="pt-8 border-t border-zinc-800">
           <div className="text-[10px] text-zinc-600 animate-pulse">
             SYSTEM STATUS: READY // BIFROST_NODE: ACTIVE
           </div>
        </div>
      </div>
    </main>
  );
}
