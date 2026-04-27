'use client';

import { useState, useEffect } from 'react';
import { useEventStream } from '@/hooks/use-event-stream';
import { useOptimisticMutation } from '@/hooks/use-optimistic';

const STAGES = ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won'];

export function RealTimePipeline({ initialOpps, orgId }: { initialOpps: any[], orgId: string }) {
  const [opps, setOpps] = useState(initialOpps);
  const { events } = useEventStream(orgId);

  // LISTEN FOR EXTERNAL TRUTH CHANGES
  useEffect(() => {
    const lastEvent = events[0];
    if (lastEvent?.payload?.action === 'opp_stage_changed') {
      setOpps(prev => prev.map(o =>
        o.oppId === lastEvent.payload.oppId
          ? { ...o, stage: lastEvent.payload.newStage }
          : o
      ));
    }
  }, [events]);

  const updateOppStage = async ({ id, stage }: { id: string, stage: string }) => {
    const res = await fetch(`/api/crm/opportunities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    });
    if (!res.ok) throw new Error("REVERT");
  };

  const { mutate } = useOptimisticMutation(
    updateOppStage,
    () => setOpps(initialOpps) // Simple rollback logic
  );

  const handleDragOver = (e: any) => e.preventDefault();

  const handleDrop = (e: any, stage: string) => {
    const id = e.dataTransfer.getData("oppId");
    // OPTIMISTIC UPDATE
    setOpps(prev => prev.map(o => o.oppId === id ? { ...o, stage } : o));
    mutate({ id, stage });
  };

  return (
    <div className="grid grid-cols-5 gap-4 h-[600px]">
      {STAGES.map(stage => (
        <div
          key={stage}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, stage)}
          className="bg-black/40 border border-emerald-900/20 rounded p-2 flex flex-col"
        >
          <h4 className="text-[10px] font-mono uppercase mb-4 text-emerald-700 border-b border-emerald-900/30 pb-1">
            {stage.replace('_', ' ')}
          </h4>
          <div className="flex-1 space-y-2">
            {opps.filter(o => o.stage === stage).map(opp => (
              <div
                key={opp.oppId}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("oppId", opp.oppId)}
                className="bg-zinc-900 border border-emerald-900/40 p-3 rounded cursor-grab active:cursor-grabbing hover:border-emerald-500 transition-colors"
              >
                <div className="text-xs font-bold text-gray-200">{opp.name}</div>
                <div className="text-[10px] font-mono text-emerald-500 mt-1">
                  ${opp.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
