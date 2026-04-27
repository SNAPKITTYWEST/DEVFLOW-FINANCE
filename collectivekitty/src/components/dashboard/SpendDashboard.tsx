'use client';

import React from 'react';

export function SpendDashboard({ orgId }: { orgId: string }) {
  // Simulated analytics data
  const data = {
    totalSpend: 124500000, // in cents
    budgetRemaining: 500000000,
    burnRate: 1200000,
    topCategories: [
      { name: 'SaaS & Infrastructure', amount: 45000000, color: 'bg-blue-500' },
      { name: 'Marketing', amount: 32000000, color: 'bg-amber-500' },
      { name: 'Payroll', amount: 25000000, color: 'bg-emerald-500' },
      { name: 'Travel', amount: 12000000, color: 'bg-coral-500' },
    ]
  };

  const formatUSD = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="terminal-border p-4 bg-zinc-900/30">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Spend Velocity</div>
          <div className="h-32 mt-2 flex items-end gap-1">
            {[40, 60, 45, 80, 55, 90, 70, 85, 65, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-500/20 hover:bg-blue-500 transition-colors"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="terminal-border p-4 bg-zinc-900/30">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Budget Allocation</div>
          <div className="mt-4 space-y-3">
            {data.topCategories.map(cat => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono uppercase">
                  <span>{cat.name}</span>
                  <span className="text-zinc-400">{formatUSD(cat.amount)}</span>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.color}`}
                    style={{ width: `${(cat.amount / data.totalSpend) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="terminal-border bg-zinc-900/20 overflow-hidden">
        <table className="w-full text-left font-mono text-[10px]">
          <thead>
            <tr className="bg-zinc-900 text-zinc-500 border-b border-zinc-800">
              <th className="p-2">ENTITY_ID</th>
              <th className="p-2">DESCRIPTION</th>
              <th className="p-2">AMOUNT</th>
              <th className="p-2">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {[1, 2, 3].map(i => (
              <tr key={i} className="hover:bg-zinc-800/30">
                <td className="p-2 text-blue-500">TXN_0x4F{i}</td>
                <td className="p-2">CLOUD_INFRA_PROVISIONING</td>
                <td className="p-2 text-white">$12,400.00</td>
                <td className="p-2">
                  <span className="px-1 bg-emerald-500/20 text-emerald-500 border border-emerald-500/50">COMMITTED</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
