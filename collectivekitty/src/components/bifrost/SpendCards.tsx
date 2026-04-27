"use client";

import { useState, useEffect } from "react";

/**
 * SpendCards Component
 * Virtual card management with freeze, limit adjustment, and transaction viewing
 */

interface VirtualCard {
  id: string;
  name: string;
  limit: number;
  spent: number;
  status: "active" | "frozen" | "closed";
  vendorLock?: string[];
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

interface SpendCardsProps {
  cards?: VirtualCard[];
  onFreeze?: (cardId: string) => void;
  onAdjustLimit?: (cardId: string, newLimit: number) => void;
}

export default function SpendCards({ cards: initialCards, onFreeze, onAdjustLimit }: SpendCardsProps) {
  const [cards, setCards] = useState<VirtualCard[]>(initialCards || []);
  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialCards) loadCards();
  }, [initialCards]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fintech/unit/cards", {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      const data = await res.json();
      if (data.data) setCards(data.data);
    } catch (e) {
      console.error("Failed to load cards:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const handleFreeze = async (cardId: string) => {
    if (onFreeze) {
      onFreeze(cardId);
    } else {
      // Default freeze action
      await fetch(`/api/fintech/unit/cards/${cardId}/freeze`, { method: "POST" });
      loadCards();
    }
  };

  const handleAdjustLimit = async (cardId: string, newLimit: number) => {
    if (onAdjustLimit) {
      onAdjustLimit(cardId, newLimit);
    } else {
      await fetch(`/api/fintech/unit/cards/${cardId}/limit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: newLimit }),
      });
      loadCards();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-900/50 text-green-400 border-green-700";
      case "frozen":
        return "bg-blue-900/50 text-blue-400 border-blue-700";
      case "closed":
        return "bg-red-900/50 text-red-400 border-red-700";
      default:
        return "bg-gray-900/50 text-gray-400 border-gray-700";
    }
  };

  const getUtilizationColor = (spent: number, limit: number) => {
    const pct = (spent / limit) * 100;
    if (pct > 90) return "bg-red-500";
    if (pct > 75) return "bg-yellow-500";
    return "bg-[#14b8a6]";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Spend Cards</h3>
        <button className="text-sm bg-[#14b8a6] text-black px-3 py-1 rounded hover:bg-[#0d9488]">
          + Issue New Card
        </button>
      </div>

      <div className="grid gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => setSelectedCard(card)}
            className={`bg-[#1a1a1f] border rounded-lg p-4 cursor-pointer transition-all hover:border-[#14b8a6] ${
              selectedCard?.id === card.id ? "border-[#14b8a6]" : "border-[#2a2a35]"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium">{card.name}</h4>
                <p className="text-xs text-[#6b6b7b]">•••• {card.lastFour || "0000"</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(card.status)}`}>
                {card.status.toUpperCase()}
              </span>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#6b6b7b]">Spent this month</span>
                <span className="font-mono">{formatCurrency(card.spent)} / {formatCurrency(card.limit)}</span>
              </div>
              <div className="h-2 bg-[#222228] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getUtilizationColor(card.spent, card.limit)}`}
                  style={{ width: `${Math.min((card.spent / card.limit) * 100, 100)}%` }}
                />
              </div>
            </div>

            {card.vendorLock && card.vendorLock.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {card.vendorLock.map((vendor) => (
                  <span key={vendor} className="text-xs bg-[#222228] px-2 py-0.5 rounded">
                    {vendor}
                  </span>
                ))}
              </div>
            )}

            {selectedCard?.id === card.id && (
              <div className="mt-4 pt-4 border-t border-[#2a2a35] flex gap-2">
                {card.status === "active" ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFreeze(card.id);
                    }}
                    className="text-sm bg-blue-900 text-blue-400 px-3 py-1 rounded border border-blue-700"
                  >
                    Freeze
                  </button>
                ) : card.status === "frozen" ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFreeze(card.id);
                    }}
                    className="text-sm bg-green-900 text-green-400 px-3 py-1 rounded border border-green-700"
                  >
                    Unfreeze
                  </button>
                ) : null}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newLimit = prompt("Enter new monthly limit:", card.limit.toString());
                    if (newLimit && !isNaN(Number(newLimit))) {
                      handleAdjustLimit(card.id, Number(newLimit));
                    }
                  }}
                  className="text-sm bg-[#222228] px-3 py-1 rounded border border-[#2a2a35]"
                >
                  Adjust Limit
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // View transactions
                  }}
                  className="text-sm bg-[#222228] px-3 py-1 rounded border border-[#2a2a35]"
                >
                  View Transactions
                </button>
              </div>
            )}
          </div>
        ))}

        {cards.length === 0 && !loading && (
          <div className="text-center py-8 text-[#6b6b7b]">
            No spend cards issued. Click &quot;Issue New Card&quot; to create one.
          </div>
        )}
      </div>

      {/* Card form modal could go here */}
    </div>
  );
}