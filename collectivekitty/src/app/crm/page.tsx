import React from 'react';
import { RealTimePipeline } from '@/components/dashboard/RealTimePipeline';
import { prisma } from '@/lib/prisma';

export default async function CRMPage() {
  const opps = await prisma.opportunity.findMany({
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <main className="min-h-screen p-6 bg-black text-white">
      <header className="mb-8 flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tighter">COLLECTIVE CRM</h1>
          <p className="text-xs text-zinc-500 font-mono">BIFROST PIPELINE v5.0</p>
        </div>
        <div className="flex gap-4">
          <a href="/app" className="terminal-border px-4 py-2 text-[10px] font-mono hover:bg-zinc-800">
            ← RETURN TO WAR ROOM
          </a>
        </div>
      </header>

      <RealTimePipeline initialOpps={opps} orgId="PRIMARY" />
    </main>
  );
}
