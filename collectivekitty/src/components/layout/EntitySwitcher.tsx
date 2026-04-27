'use client';

import React from 'react';

const entities = [
  { id: 'PRIMARY', name: 'SnapKitty B-Corp', color: 'bg-blue-500', type: 'CORPORATE' },
  { id: 'DIF', name: 'Kitty Foundation (DIF)', color: 'bg-amber-500', type: 'NON_PROFIT' },
  { id: 'VAULT', name: 'Sovereign Trust Vault', color: 'bg-emerald-500', type: 'TRUST' }
];

export function EntitySwitcher({ currentOrgId, onSwitch }: { currentOrgId: string, onSwitch: (id: string) => void }) {
  const current = entities.find(e => e.id === currentOrgId) || entities[0];

  return (
    <div className="flex items-center gap-2 p-2 terminal-border bg-zinc-900 mb-6">
      <div className="text-[10px] font-mono text-gray-500 uppercase px-2">Entity Context:</div>
      <div className="flex gap-1">
        {entities.map(entity => (
          <button
            key={entity.id}
            onClick={() => onSwitch(entity.id)}
            className={`px-3 py-1 text-[11px] font-mono transition-all ${
              currentOrgId === entity.id
                ? `${entity.color} text-black font-bold`
                : 'text-gray-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {entity.name}
          </button>
        ))}
      </div>
      <div className="ml-auto px-4 py-1 terminal-border border-zinc-700 bg-black">
        <span className="text-[10px] font-mono text-zinc-500">MODE:</span>
        <span className="text-[10px] font-mono text-zinc-300 ml-2">{current.type}</span>
      </div>
    </div>
  );
}
