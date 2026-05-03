import React, { useState } from 'react';
import { ChevronDown, X, Tag, Users, Layers, Calendar } from 'lucide-react';
import { DealStage, UserId } from '@/lib/types/branded';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FilterState {
  stages: DealStage[];
  owners: UserId[];
  dateRange: { from: Date; to: Date } | null;
  tags: string[];
}

interface FilterPanelProps {
  state: FilterState;
  onChange: (newState: FilterState) => void;
  availableStages: DealStage[];
  availableOwners: { id: UserId; name: string }[];
  availableTags: string[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  state,
  onChange,
  availableStages,
  availableOwners,
  availableTags
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    stages: false,
    owners: false,
    tags: false,
    date: false
  });

  const toggleSection = (section: string) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleItem = <K extends keyof FilterState>(key: K, item: any) => {
    const current = state[key] as any[];
    const next = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    onChange({ ...state, [key]: next });
  };

  const removePill = (type: keyof FilterState, value: any) => {
    if (type === 'dateRange') {
      onChange({ ...state, dateRange: null });
    } else {
      const current = state[type] as any[];
      onChange({ ...state, [type]: current.filter(v => v !== value) });
    }
  };

  const Section = ({
    id,
    title,
    icon: Icon,
    children,
    empty
  }: {
    id: string;
    title: string;
    icon: any;
    children: React.ReactNode;
    empty: boolean;
  }) => (
    <div className="border-b border-zinc-800 last:border-0">
      <button
        onClick={() => toggleSection(id)}
        className="flex items-center justify-between w-full px-4 py-4 hover:bg-zinc-800/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className="text-zinc-500 group-hover:text-purple-400 transition-colors" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200">{title}</span>
        </div>
        <ChevronDown
          size={16}
          className={cn("text-zinc-600 transition-transform duration-150", collapsed[id] && "-rotate-90")}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-150 ease-in-out",
          collapsed[id] ? "max-h-0" : "max-h-96"
        )}
      >
        <div className="px-4 pb-4">
          {empty ? (
            <div className="py-2 text-xs text-zinc-600 italic">No available {title.toLowerCase()}</div>
          ) : children}
        </div>
      </div>
    </div>
  );

  const hasFilters = state.stages.length > 0 || state.owners.length > 0 || state.tags.length > 0 || state.dateRange;

  return (
    <div className="w-64 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
      {hasFilters && (
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex flex-wrap gap-2">
          {state.stages.map(s => (
            <button
              key={s}
              onClick={() => removePill('stages', s)}
              className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] font-bold text-purple-400 hover:bg-purple-500/20 transition-colors"
            >
              {s.replace('_', ' ')} <X size={10} />
            </button>
          ))}
          {state.owners.map(o => (
            <button
              key={o}
              onClick={() => removePill('owners', o)}
              className="flex items-center gap-1.5 px-2 py-1 bg-teal-500/10 border border-teal-500/20 rounded text-[10px] font-bold text-teal-400 hover:bg-teal-500/20 transition-colors"
            >
              {availableOwners.find(ao => ao.id === o)?.name || o} <X size={10} />
            </button>
          ))}
          {state.tags.map(t => (
            <button
              key={t}
              onClick={() => removePill('tags', t)}
              className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-bold text-zinc-400 hover:bg-zinc-700 transition-colors"
            >
              {t} <X size={10} />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <Section id="stages" title="Stages" icon={Layers} empty={availableStages.length === 0}>
          <div className="space-y-1">
            {availableStages.map(stage => (
              <label key={stage} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 cursor-pointer transition-colors group">
                <input
                  type="checkbox"
                  checked={state.stages.includes(stage)}
                  onChange={() => toggleItem('stages', stage)}
                  className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-purple-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">{stage.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </Section>

        <Section id="owners" title="Owners" icon={Users} empty={availableOwners.length === 0}>
           <div className="space-y-1">
            {availableOwners.map(owner => (
              <label key={owner.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 cursor-pointer transition-colors group">
                <input
                  type="checkbox"
                  checked={state.owners.includes(owner.id)}
                  onChange={() => toggleItem('owners', owner.id)}
                  className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-teal-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">{owner.name}</span>
              </label>
            ))}
          </div>
        </Section>

        <Section id="tags" title="Tags" icon={Tag} empty={availableTags.length === 0}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleItem('tags', tag)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold transition-all border",
                  state.tags.includes(tag)
                    ? "bg-zinc-100 border-white text-black"
                    : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </Section>

        <Section id="date" title="Timeframe" icon={Calendar} empty={false}>
          <div className="grid grid-cols-2 gap-2 pt-1">
             <button className="px-2 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-bold text-zinc-500 hover:border-zinc-700">Last 7d</button>
             <button className="px-2 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-bold text-zinc-500 hover:border-zinc-700">Last 30d</button>
          </div>
        </Section>
      </div>
    </div>
  );
};
