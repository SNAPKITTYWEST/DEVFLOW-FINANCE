"use client";

import { useEffect, useState, useRef } from "react";
import { useEventStream } from "@/hooks/useEventStream";
import { useKanban } from "@/hooks/useKanban";

/**
 * BIFROST SPEND CONTROL TOWER - Main Layout
 * Real-time financial nervous system
 */

interface Event {
  id: string;
  timestamp: string;
  type: string;
  amount?: number;
  vendor?: string;
  status?: string;
  description?: string;
}

interface SpendCard {
  id: string;
  name: string;
  limit: number;
  spent: number;
  status: "active" | "frozen" | "closed";
  vendorLock?: string[];
}

interface BudgetDept {
  name: string;
  used: number;
  total: number;
}

export default function BifrostSpendLayout() {
  const { events, connected } = useEventStream("/api/events/stream");
  const [activeTab, setActiveTab] = useState("overview");
  const [spendCards, setSpendCards] = useState<SpendCard[]>([]);
  const [budgets, setBudgets] = useState<BudgetDept[]>([]);
  const [approvals, setApprovals] = useState<Event[]>([]);

  // Load initial data
  useEffect(() => {
    fetchSpendCards();
    fetchBudgets();
    fetchPendingApprovals();
  }, []);

  const fetchSpendCards = async () => {
    try {
      const res = await fetch("/api/fintech/unit/cards", {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      const data = await res.json();
      if (data.data) setSpendCards(data.data);
    } catch (e) {
      console.error("Failed to load cards:", e);
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await fetch("/api/budgets");
      const data = await res.json();
      if (data.data) setBudgets(data.data);
    } catch (e) {
      console.error("Failed to load budgets:", e);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch("/api/procurement/requisitions?status=pending");
      const data = await res.json();
      if (data.data) setApprovals(data.data);
    } catch (e) {
      console.error("Failed to load approvals:", e);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "active":
      case "paid":
        return "text-green-400";
      case "pending":
      case "warning":
      case "review":
        return "text-yellow-400";
      case "rejected":
      case "failed":
      case "overspend":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0b] text-white font-mono">
      {/* LEFT NAV */}
      <nav className="w-16 bg-[#111114] border-r border-[#2a2a35] flex flex-col items-center py-4">
        <div className="w-10 h-10 bg-[#14b8a6] rounded flex items-center justify-center font-bold text-black mb-6">
          B
        </div>

        {[
          { id: "overview", icon: "◉", label: "Overview" },
          { id: "ledger", icon: "≡", label: "Live Ledger" },
          { id: "cards", icon: "◇", label: "Spend Cards" },
          { id: "approvals", icon: "◷", label: "Approvals" },
          { id: "budgets", icon: "▦", label: "Budgets" },
          { id: "recon", icon: "⟲", label: "Reconciliation" },
          { id: "alerts", icon: "⚠", label: "Alerts" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-10 h-10 rounded flex items-center justify-center mb-2 text-lg transition-all ${
              activeTab === item.id
                ? "bg-[#14b8a6] text-black"
                : "text-[#6b6b7b] hover:bg-[#222228]"
            }`}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}

        <div className="mt-auto flex flex-col items-center gap-2 pb-4">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} title={connected ? "Connected" : "Disconnected"} />
          <span className="text-[10px] text-[#6b6b7b]">{connected ? "LIVE" : "OFF"}</span>
        </div>
      </nav>

      {/* CENTER - BIFROST LEDGER STREAM */}
      <div className="flex-1 flex flex-col border-r border-[#2a2a35]">
        <header className="h-14 bg-[#111114] border-b border-[#2a2a35] flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#14b8a6] font-bold">BIFROST</span>
            <span className="text-[#6b6b7b]">Spend Control Tower</span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search transactions... (⌘K)"
              className="bg-[#1a1a1f] border border-[#2a2a35] rounded px-3 py-1 text-sm w-64 outline-none focus:border-[#14b8a6]"
            />
            <button className="bg-[#14b8a6] text-black px-3 py-1 rounded text-sm font-medium">+ New Request</button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse"></span>
            Live Ledger Stream
          </h2>

          <div className="space-y-1">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 p-2 rounded hover:bg-[#1a1a1f] text-sm cursor-pointer transition-colors"
              >
                <span className="text-[#4a4a58] w-20 font-mono">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className={`w-24 font-medium ${getStatusColor(event.status || "pending")}`}>
                  {event.type}
                </span>
                {event.amount && (
                  <span className="w-28 text-right font-mono">{formatCurrency(event.amount)}</span>
                )}
                <span className="flex-1 text-[#9a9aa8]">{event.description || event.vendor}</span>
              </div>
            ))}

            {events.length === 0 && (
              <div className="text-[#4a4a58] text-center py-8">Waiting for transactions...</div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - AI INSIGHTS */}
      <div className="w-80 bg-[#111114] flex flex-col">
        <div className="h-14 border-b border-[#2a2a35] flex items-center px-4">
          <span className="text-[#14b8a6]">●</span>
          <span className="ml-2 font-medium">AI Insights</span>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <InsightCard title="Spend Analysis">
            <p className="text-sm">Spend increased <span className="text-[#14b8a6]">18% WoW</span> in SaaS tools</p>
            <p className="text-xs text-[#6b6b7b] mt-1">3 vendors exceed thresholds</p>
          </InsightCard>

          <InsightCard title="Budget Alerts">
            {budgets.map((budget) => (
              <div key={budget.name} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>{budget.name}</span>
                  <span className={budget.used / budget.total > 0.8 ? "text-red-400" : ""}>
                    {Math.round((budget.used / budget.total) * 100)}%
                  </span>
                </div>
                <div className="h-1 bg-[#222228] rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      budget.used / budget.total > 0.8 ? "bg-red-500" : "bg-[#14b8a6]"
                    }`}
                    style={{ width: `${(budget.used / budget.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </InsightCard>

          <InsightCard title="Anomaly Detection">
            <p className="text-sm">Unapproved spend in Engineering</p>
            <p className="text-xs text-[#6b6b7b] mt-1">$2,400 - Review required</p>
          </InsightCard>
        </div>

        {/* SPEND CARDS SECTION */}
        <div className="border-t border-[#2a2a35] p-4">
          <h3 className="font-medium mb-3">Spend Cards</h3>
          <div className="space-y-2">
            {spendCards.map((card) => (
              <div key={card.id} className="bg-[#1a1a1f] p-3 rounded border border-[#2a2a35]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">Engineering Team</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${card.status === "active" ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
                    {card.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-[#6b6b7b]">
                  {formatCurrency(card.spent)} / {formatCurrency(card.limit)}
                </div>
                <div className="h-1 mt-2 bg-[#222228] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#14b8a6]"
                    style={{ width: `${(card.spent / card.limit) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PENDING APPROVALS */}
        <div className="border-t border-[#2a2a35] p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            Pending Approvals
            <span className="bg-yellow-600 text-black text-xs px-2 py-0.5 rounded">{approvals.length}</span>
          </h3>
          <div className="space-y-2">
            {approvals.slice(0, 3).map((approval) => (
              <div key={approval.id} className="bg-[#1a1a1f] p-2 rounded flex justify-between items-center">
                <div className="text-sm">
                  <p className="font-medium">{approval.vendor}</p>
                  <p className="text-xs text-[#6b6b7b]">{formatCurrency(approval.amount || 0)}</p>
                </div>
                <div className="flex gap-1">
                  <button className="bg-[#14b8a6] text-black px-2 py-1 rounded text-xs">Approve</button>
                  <button className="bg-[#222228] px-2 py-1 rounded text-xs">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a35] rounded p-3">
      <h4 className="text-xs font-medium text-[#6b6b7b] uppercase mb-2">{title}</h4>
      {children}
    </div>
  );
}