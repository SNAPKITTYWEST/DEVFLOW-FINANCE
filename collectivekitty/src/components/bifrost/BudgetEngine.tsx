"use client";

import { useState, useEffect, useMemo } from "react";

/**
 * BudgetEngine Component
 * Department budget visualization with burn rate and AI forecasting
 */

interface Budget {
  id: string;
  department: string;
  used: number;
  allocated: number;
  burnRate?: number;
  forecast?: number;
}

interface BudgetEngineProps {
  budgets?: Budget[];
  onAdjustAllocation?: (budgetId: string, newAmount: number) => void;
}

export default function BudgetEngine({ budgets: initialBudgets, onAdjustAllocation }: BudgetEngineProps) {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets || []);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialBudgets) loadBudgets();
  }, [initialBudgets]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/budgets");
      const data = await res.json();
      if (data.data) setBudgets(data.data);
    } catch (e) {
      console.error("Failed to load budgets:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
  };

  // Computed values
  const totals = useMemo(() => {
    return budgets.reduce(
      (acc, b) => ({
        allocated: acc.allocated + b.allocated,
        used: acc.used + b.used,
        projected: acc.projected + (b.forecast || b.used * 1.2),
      }),
      { allocated: 0, used: 0, projected: 0 }
    );
  }, [budgets]);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 85) return "bg-yellow-500";
    return "bg-[#14b8a6]";
  };

  const getPercentage = (used: number, allocated: number) => {
    if (allocated === 0) return 0;
    return (used / allocated) * 100;
  };

  const getRiskBadge = (percentage: number) => {
    if (percentage >= 100) return { label: "OVERSPEND", color: "bg-red-900 text-red-400" };
    if (percentage >= 85) return { label: "WARNING", color: "bg-yellow-900 text-yellow-400" };
    return { label: "HEALTHY", color: "bg-green-900 text-green-400" };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Budget Engine</h3>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-[#6b6b7b]">Total Allocated:</span>
            <span className="ml-2 font-mono">{formatCurrency(totals.allocated)}</span>
          </div>
          <div>
            <span className="text-[#6b6b7b]">Projected:</span>
            <span className={`ml-2 font-mono ${totals.projected > totals.allocated ? "text-red-400" : "text-green-400"}`}>
              {formatCurrency(totals.projected)}
            </span>
          </div>
        </div>
      </div>

      {/* Budget Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((budget) => {
          const percentage = getPercentage(budget.used, budget.allocated);
          const risk = getRiskBadge(percentage);
          const remaining = budget.allocated - budget.used;
          const daysRemaining = 15; // Simplified - could calculate from dates

          return (
            <div
              key={budget.id}
              onClick={() => setSelectedDept(selectedDept === budget.id ? null : budget.id)}
              className={`bg-[#1a1a1f] border rounded-lg p-4 cursor-pointer transition-all hover:border-[#14b8a6] ${
                selectedDept === budget.id ? "border-[#14b8a6]" : "border-[#2a2a35]"
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">{budget.department}</h4>
                  <p className="text-xs text-[#6b6b7b]">{daysRemaining} days remaining</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs border ${risk.color}`}>{risk.label}</span>
              </div>

              {/* Usage Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#6b6b7b]">Usage</span>
                  <span className="font-mono">{percentage.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-[#222228] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getStatusColor(percentage)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Numbers */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-[#6b6b7b] text-xs">Used</p>
                  <p className="font-mono">{formatCurrency(budget.used)}</p>
                </div>
                <div>
                  <p className="text-[#6b6b7b] text-xs">Remaining</p>
                  <p className={`font-mono ${remaining < 0 ? "text-red-400" : ""}`}>{formatCurrency(remaining)}</p>
                </div>
              </div>

              {/* Burn Rate */}
              {budget.burnRate && (
                <div className="mt-3 pt-3 border-t border-[#2a2a35]">
                  <p className="text-[#6b6b7b] text-xs">Burn Rate</p>
                  <p className="font-mono">{formatCurrency(budget.burnRate)}/day</p>
                </div>
              )}

              {/* AI Forecast */}
              {budget.forecast && (
                <div className="mt-3 pt-3 border-t border-[#2a2a35]">
                  <p className="text-[#6b6b7b] text-xs">AI Forecast (EOM)</p>
                  <p className={`font-mono ${budget.forecast > budget.allocated ? "text-red-400" : "text-green-400"}`}>
                    {formatCurrency(budget.forecast)}
                  </p>
                </div>
              )}

              {/* Expandable Actions */}
              {selectedDept === budget.id && (
                <div className="mt-4 pt-4 border-t border-[#2a2a35] flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newAlloc = prompt("Enter new allocation:", budget.allocated.toString());
                      if (newAlloc && !isNaN(Number(newAlloc))) {
                        if (onAdjustAllocation) {
                          onAdjustAllocation(budget.id, Number(newAlloc));
                        }
                      }
                    }}
                    className="text-sm bg-[#14b8a6] text-black px-3 py-1 rounded flex-1"
                  >
                    Adjust Budget
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // View detailed breakdown
                    }}
                    className="text-sm bg-[#222228] px-3 py-1 rounded border border-[#2a2a35] flex-1"
                  >
                    Details
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {budgets.length === 0 && !loading && (
        <div className="text-center py-8 text-[#6b6b7b]">No budgets configured. Create one to get started.</div>
      )}
    </div>
  );
}