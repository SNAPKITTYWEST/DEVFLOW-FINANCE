import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import {
  LayoutDashboard,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Users,
  ArrowRight,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Phone,
  Mail,
  List,
  Kanban as KanbanIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Stage = 'PROSPECTING' | 'QUALIFIED' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';

interface Activity {
  id: string;
  type: 'note' | 'call' | 'email';
  content: string;
  timestamp: string;
  author: string;
}

interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: Stage;
  owner: string;
  daysInStage: number;
  status: 'on_track' | 'at_risk' | 'stalled';
  expectedClose: string;
  source: 'LinkedIn' | 'Referral' | 'Inbound' | 'Outbound';
  activities: Activity[];
}

// --- Mock Data ---
const INITIAL_DEALS: Deal[] = [
  {
    id: '1',
    name: 'Enterprise License Expansion',
    company: 'Nova Corp',
    value: 45000,
    stage: 'NEGOTIATION',
    owner: 'Alex Rivera',
    daysInStage: 4,
    status: 'on_track',
    expectedClose: '2025-06-15',
    source: 'Inbound',
    activities: [
      { id: 'a1', type: 'note', content: 'Met with CTO. Technical requirements confirmed.', timestamp: '2025-05-20', author: 'Alex Rivera' },
      { id: 'a2', type: 'call', content: 'Follow-up on pricing structure.', timestamp: '2025-05-22', author: 'Alex Rivera' }
    ]
  },
  {
    id: '2',
    name: 'Global Rollout Phase 1',
    company: 'Quantum Labs',
    value: 125000,
    stage: 'QUALIFIED',
    owner: 'Sarah Chen',
    daysInStage: 12,
    status: 'at_risk',
    expectedClose: '2025-08-01',
    source: 'Referral',
    activities: []
  },
  {
    id: '3',
    name: 'SaaS Migration',
    company: 'Starlight Inc',
    value: 12000,
    stage: 'PROSPECTING',
    owner: 'Marcus Wright',
    daysInStage: 2,
    status: 'on_track',
    expectedClose: '2025-07-10',
    source: 'LinkedIn',
    activities: []
  },
  {
    id: '4',
    name: 'Core Infrastructure Suite',
    company: 'Apex Systems',
    value: 85000,
    stage: 'CLOSED_WON',
    owner: 'Elena Rossi',
    daysInStage: 30,
    status: 'on_track',
    expectedClose: '2025-05-01',
    source: 'Outbound',
    activities: []
  }
];

// --- Components ---

const StatCard = ({ label, value, subtext }: { label: string; value: string; subtext?: string }) => (
  <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
    <div className="text-zinc-500 text-xs uppercase font-mono tracking-widest mb-1">{label}</div>
    <div className="text-2xl font-bold text-[#00D4AA] font-mono">{value}</div>
    {subtext && <div className="text-zinc-600 text-[10px] mt-1 uppercase">{subtext}</div>}
  </div>
);

const DealCard = ({
  deal,
  onClick,
  onDragStart
}: {
  deal: Deal;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) => (
  <motion.div
    layoutId={deal.id}
    draggable
    onDragStart={(e) => onDragStart(e as any, deal.id)}
    onClick={onClick}
    className="bg-[#111] border border-[#222] p-4 rounded-lg cursor-grab active:cursor-grabbing hover:border-[#00D4AA]/50 transition-colors group mb-3 shadow-lg"
  >
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-bold text-sm text-white group-hover:text-[#00D4AA] transition-colors">{deal.name}</h4>
      <MoreHorizontal className="w-4 h-4 text-zinc-600 cursor-pointer hover:text-white" />
    </div>
    <div className="text-xs text-zinc-400 mb-3">{deal.company}</div>

    <div className="flex justify-between items-end">
      <div>
        <div className="text-sm font-mono text-[#00D4AA] font-bold">
          ${deal.value.toLocaleString()}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1 uppercase">
          <Users className="w-3 h-3" /> {deal.owner}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className={cn(
          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
          deal.status === 'on_track' ? 'bg-teal-400/10 text-teal-400' :
          deal.status === 'at_risk' ? 'bg-yellow-400/10 text-yellow-400' :
          'bg-red-400/10 text-red-400'
        )}>
          {deal.status.replace('_', ' ')}
        </div>
        <div className="text-[9px] text-zinc-600 flex items-center gap-1 uppercase">
          <Clock className="w-2.5 h-2.5" /> {deal.daysInStage}d
        </div>
      </div>
    </div>
  </motion.div>
);

const KanbanColumn = ({
  stage,
  deals,
  onDrop,
  onDealClick,
  onDragStart
}: {
  stage: Stage;
  deals: Deal[];
  onDrop: (e: React.DragEvent, stage: Stage) => void;
  onDealClick: (deal: Deal) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) => {
  const [isOver, setIsOver] = useState(false);

  const stageMeta = {
    'PROSPECTING': { label: 'Prospecting', color: 'bg-blue-500' },
    'QUALIFIED': { label: 'Qualified', color: 'bg-yellow-500' },
    'NEGOTIATION': { label: 'Negotiation', color: 'bg-orange-500' },
    'CLOSED_WON': { label: 'Closed Won', color: 'bg-green-500' },
    'CLOSED_LOST': { label: 'Closed Lost', color: 'bg-red-500' }
  };

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div
      className={cn(
        "flex-1 min-w-[300px] flex flex-col h-full rounded-xl transition-colors",
        isOver ? "bg-zinc-900/40" : "bg-transparent"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { setIsOver(false); onDrop(e, stage); }}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", stageMeta[stage].color)}></div>
          <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-400">
            {stageMeta[stage].label}
          </h3>
          <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
            {deals.length}
          </span>
        </div>
        <div className="text-xs font-mono text-zinc-500">
          ${(totalValue / 1000).toFixed(1)}k
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {deals.map(deal => (
          <DealCard
            key={deal.id}
            deal={deal}
            onClick={() => onDealClick(deal)}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
};

// --- Main Page ---

export default function CRMPortal() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const stats = useMemo(() => {
    const total = deals.reduce((sum, d) => sum + d.value, 0);
    const won = deals.filter(d => d.stage === 'CLOSED_WON').length;
    const closed = deals.filter(d => d.stage.startsWith('CLOSED')).length;
    const winRate = closed > 0 ? (won / closed) * 100 : 0;
    const avgSize = deals.length > 0 ? total / deals.length : 0;

    return {
      total: `$${(total / 1000).toFixed(1)}k`,
      winRate: `${winRate.toFixed(0)}%`,
      avgSize: `$${(avgSize / 1000).toFixed(1)}k`,
      count: deals.length
    };
  }, [deals]);

  const filteredDeals = useMemo(() => {
    return deals.filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.company.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [deals, searchQuery]);

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDrop = (e: React.DragEvent, targetStage: Stage) => {
    const dealId = e.dataTransfer.getData('dealId');
    setDeals(prev => prev.map(d =>
      d.id === dealId ? { ...d, stage: targetStage, daysInStage: 0 } : d
    ));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#00D4AA]/30">
      <Head>
        <title>CRM | SnapKitty OS</title>
      </Head>

      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-30 p-6">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 text-zinc-500 mb-1">
              <a href="/dashboard" className="text-[10px] tracking-widest hover:text-[#00D4AA] transition-colors uppercase font-mono">Control Tower</a>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[10px] tracking-widest text-[#00D4AA] uppercase font-mono">CRM Pipeline</span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">Sales Velocity</h1>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                placeholder="Search deals or companies..."
                className="w-full bg-[#111] border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-[#00D4AA] outline-none transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex bg-[#111] border border-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  "p-1.5 rounded transition-all",
                  viewMode === 'kanban' ? "bg-zinc-800 text-[#00D4AA]" : "text-zinc-600 hover:text-white"
                )}
              >
                <KanbanIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded transition-all",
                  viewMode === 'list' ? "bg-zinc-800 text-[#00D4AA]" : "text-zinc-600 hover:text-white"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#00D4AA] text-black h-10 px-6 rounded-lg font-bold flex items-center gap-2 hover:bg-[#00f2c3] transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> NEW DEAL
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-6">
        {/* Stats Bar */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard label="Total Pipeline" value={stats.total} subtext={`Across ${stats.count} opportunities`} />
          <StatCard label="Avg Deal Size" value={stats.avgSize} subtext="Weighted average" />
          <StatCard label="Win Rate" value={stats.winRate} subtext="Last 90 days" />
          <StatCard label="Momentum" value="High" subtext="Bifrost Velocity Score" />
        </section>

        {/* View Content */}
        {viewMode === 'kanban' ? (
          <div className="flex gap-6 h-[calc(100vh-420px)] overflow-x-auto pb-6 custom-scrollbar min-h-[600px]">
            {(['PROSPECTING', 'QUALIFIED', 'NEGOTIATION', 'CLOSED_WON'] as Stage[]).map(stage => (
              <KanbanColumn
                key={stage}
                stage={stage}
                deals={filteredDeals.filter(d => d.stage === stage)}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
                onDealClick={(d) => setSelectedDeal(d)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#161616]">
                  <th className="py-4 px-6 text-[10px] uppercase font-mono tracking-widest text-zinc-500">Deal Name</th>
                  <th className="py-4 px-6 text-[10px] uppercase font-mono tracking-widest text-zinc-500">Company</th>
                  <th className="py-4 px-6 text-[10px] uppercase font-mono tracking-widest text-zinc-500">Value</th>
                  <th className="py-4 px-6 text-[10px] uppercase font-mono tracking-widest text-zinc-500">Stage</th>
                  <th className="py-4 px-6 text-[10px] uppercase font-mono tracking-widest text-zinc-500">Owner</th>
                  <th className="py-4 px-6 text-[10px] uppercase font-mono tracking-widest text-zinc-500 text-right">Close Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredDeals.map(deal => (
                  <tr
                    key={deal.id}
                    className="hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm group-hover:text-[#00D4AA] transition-colors">{deal.name}</div>
                    </td>
                    <td className="py-4 px-6 text-zinc-400 text-sm">{deal.company}</td>
                    <td className="py-4 px-6 font-mono text-[#00D4AA] font-bold text-sm">${deal.value.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-bold uppercase text-zinc-400">
                        {deal.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-zinc-500">{deal.owner}</td>
                    <td className="py-4 px-6 text-right text-xs text-zinc-600 font-mono">{deal.expectedClose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedDeal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDeal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full md:w-[600px] bg-[#111] border-l border-zinc-800 z-50 p-0 overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-zinc-800 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-[#00D4AA] text-[10px] font-mono uppercase tracking-widest mb-2">
                    <CheckCircle2 className="w-3 h-3" /> {selectedDeal.stage.replace('_', ' ')}
                  </div>
                  <h2 className="text-2xl font-black uppercase italic">{selectedDeal.name}</h2>
                  <p className="text-zinc-500 font-medium">{selectedDeal.company}</p>
                </div>
                <button
                  onClick={() => setSelectedDeal(null)}
                  className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {/* Highlights */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                  <div>
                    <label className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest block mb-1">Contract Value</label>
                    <div className="text-3xl font-black text-[#00D4AA] font-mono">${selectedDeal.value.toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest block mb-1">Owner</label>
                    <div className="flex items-center gap-2 font-bold uppercase text-sm">
                      <div className="w-6 h-6 rounded bg-[#00D4AA] text-black flex items-center justify-center text-[10px] font-black">
                        {selectedDeal.owner[0]}
                      </div>
                      {selectedDeal.owner}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest block mb-1">Expected Close</label>
                    <div className="font-mono text-zinc-300 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                      {selectedDeal.expectedClose}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest block mb-1">Source</label>
                    <div className="text-zinc-300 text-sm">{selectedDeal.source}</div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-8 flex justify-between items-center">
                  <h3 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#00D4AA]" /> Activity Timeline
                  </h3>
                  <button className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded font-black text-zinc-400">
                    LOG ACTIVITY
                  </button>
                </div>

                <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-zinc-800">
                  {selectedDeal.activities.length > 0 ? selectedDeal.activities.map(activity => (
                    <div key={activity.id} className="relative pl-10">
                      <div className="absolute left-0 top-1 p-1 bg-zinc-900 border border-zinc-800 rounded">
                        {activity.type === 'note' ? <FileText className="w-4 h-4 text-teal-400" /> :
                         activity.type === 'call' ? <Phone className="w-4 h-4 text-blue-400" /> :
                         <Mail className="w-4 h-4 text-yellow-400" />}
                      </div>
                      <div className="text-[10px] text-zinc-600 font-mono mb-1">{activity.timestamp} • {activity.author}</div>
                      <div className="text-sm text-zinc-300 bg-[#161616] p-4 rounded border border-zinc-800">
                        {activity.content}
                      </div>
                    </div>
                  )) : (
                    <div className="pl-10 text-zinc-600 text-sm italic">No recent activity logged for this deal.</div>
                  )}
                </div>
              </div>

              <div className="p-8 border-t border-zinc-800 bg-[#0c0c0c] flex gap-4">
                <button className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-lg hover:bg-zinc-700 transition-colors">EDIT DEAL</button>
                <button className="flex-1 bg-red-900/20 text-red-500 font-bold py-3 rounded-lg border border-red-900/30 hover:bg-red-900/30 transition-colors">CLOSE LOST</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Deal Modal placeholder (Full logic omitted for brevity, but UI skeleton provided) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="bg-[#111] border border-zinc-800 w-full max-w-2xl rounded-2xl p-8 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#00D4AA]"></div>
            <h2 className="text-2xl font-black uppercase italic mb-8">Initiate New Opportunity</h2>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsAddModalOpen(false); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Deal Name</label>
                  <input type="text" className="w-full bg-black border border-zinc-800 rounded p-3 text-sm focus:border-[#00D4AA] outline-none" placeholder="e.g. Q3 Expansion" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Company</label>
                  <input type="text" className="w-full bg-black border border-zinc-800 rounded p-3 text-sm focus:border-[#00D4AA] outline-none" placeholder="Target Organization" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Contract Value ($)</label>
                  <input type="number" className="w-full bg-black border border-zinc-800 rounded p-3 text-sm focus:border-[#00D4AA] outline-none" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Stage</label>
                  <select className="w-full bg-black border border-zinc-800 rounded p-3 text-sm focus:border-[#00D4AA] outline-none">
                    <option value="PROSPECTING">Prospecting</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="NEGOTIATION">Negotiation</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-lg hover:bg-zinc-700 transition-colors uppercase text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-[#00D4AA] text-black font-bold py-3 rounded-lg hover:bg-[#00f2c3] transition-colors uppercase text-sm">Commit Opportunity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #222;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
}
