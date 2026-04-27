'use client';

import { useEventStream } from '@/hooks/use-event-stream';

export function ActivityFeed({ orgId }: { orgId: string }) {
  const { events, isConnected } = useEventStream(orgId);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'FINANCIAL': return 'text-emerald-500';
      case 'CRM_SYNC': return 'text-blue-500';
      case 'SYSTEM': return 'text-amber-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-black/50 border border-emerald-900/30 p-4 rounded shadow-2xl h-[400px] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-500">Live Activity Feed</h3>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
        {events.map((event) => (
          <div key={event.id} className="text-[10px] font-mono border-l border-emerald-900/50 pl-2 py-1">
            <span className="text-gray-500">[{new Date(event.timestamp).toLocaleTimeString()}]</span>{' '}
            <span className={getEventColor(event.type)}>{event.type}:</span>{' '}
            <span className="text-gray-300">{event.payload.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
