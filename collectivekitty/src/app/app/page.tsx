import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { RealTimePipeline } from '@/components/dashboard/RealTimePipeline';
import { prisma } from '@/lib/prisma';
import { getSovereignContext } from '@/lib/auth-guard';

export default async function CommandCentre() {
  const ctx = await getSovereignContext();

  // FETCH INITIAL TRUTH FROM NEON
  const opps = await prisma.opportunity.findMany({
    orderBy: { updatedAt: 'desc' }
  });

  const stats = [
    { label: 'Pipeline Value', value: '$1.74B', color: 'text-blue-500' },
    { label: 'Total Spend', value: '$124.5M', color: 'text-amber-500' },
    { label: 'Win Rate', value: '68%', color: 'text-emerald-500' },
    { label: 'SCS Score', value: '780', color: 'text-white' }
  ];

  return (
    <main className="min-h-screen p-6 space-y-6 bg-black">
      {/* KPI ROW */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="terminal-border p-4 bg-zinc-900/50">
            <div className="text-[10px] font-mono text-gray-500 uppercase">{s.label}</div>
            <div className={`text-2xl font-bold mono-num ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* LEFT: ACTIVITY FEED */}
        <div className="col-span-1">
          <ActivityFeed orgId="PRIMARY" />
        </div>

        {/* CENTRE: PIPELINE */}
        <div className="col-span-3">
          <RealTimePipeline initialOpps={opps} orgId="PRIMARY" />
        </div>
      </div>
    </main>
  );
}
