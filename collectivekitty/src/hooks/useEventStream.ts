"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";

/**
 * useEventStream - Real-time SSE hook
 * Connects to Bifrost event stream for live updates
 */

interface StreamEvent {
  id: string;
  timestamp: string;
  type: string;
  amount?: number;
  currency?: string;
  vendor?: string;
  status?: string;
  description?: string;
  data?: Record<string, unknown>;
}

interface UseEventStreamOptions {
  url?: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onError?: (error: Event) => void;
  onReconnect?: () => void;
}

export function useEventStream(options: UseEventStreamOptions = {}) {
  const {
    url = "/api/events/stream",
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onError,
    onReconnect,
  } = options;

  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const attemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      eventSourceRef.current = new EventSource(url);

      eventSourceRef.current.onopen = () => {
        setConnected(true);
        setError(null);
        attemptsRef.current = 0;
        console.log("[BifrostStream] Connected");
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data: StreamEvent = JSON.parse(event.data);

          // Handle ping (keep-alive)
          if (data.type === "ping") return;

          setEvents((prev) => [data, ...prev].slice(0, 500));
        } catch (e) {
          console.error("[BifrostStream] Parse error:", e);
        }
      };

      eventSourceRef.current.onerror = (e) => {
        console.error("[BifrostStream] Connection error:", e);
        setConnected(false);
        setError(e as unknown as Event);

        if (onError) onError(e as unknown as Event);

        // Cleanup and attempt reconnect
        eventSourceRef.current?.close();

        if (attemptsRef.current < reconnectAttempts) {
          attemptsRef.current++;
          console.log(`[BifrostStream] Reconnecting... (${attemptsRef.current}/${reconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            if (onReconnect) onReconnect();
            connect();
          }, reconnectInterval);
        }
      };
    } catch (e) {
      console.error("[BifrostStream] Failed to connect:", e);
      setError(e as unknown as Event);
    }
  }, [url, reconnectAttempts, reconnectInterval, onError, onReconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    eventSourceRef.current?.close();
    setConnected(false);
    console.log("[BifrostStream] Disconnected");
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => disconnect();
  }, [connect, disconnect]);

  // Computed values
  const totals = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        if (event.type === "PAYMENT_RECEIVED" || event.type === "DEPOSIT") {
          acc.inflow += event.amount || 0;
        } else if (event.type === "PAYOUT" || event.type === "SPEND") {
          acc.outflow += event.amount || 0;
        }
        if (event.status === "failed" || event.status === "error") {
          acc.errors++;
        }
        return acc;
      },
      { inflow: 0, outflow: 0, errors: 0 }
    );
  }, [events]);

  const transactionsByType = useMemo(() => {
    const grouped: Record<string, StreamEvent[]> = {};
    for (const event of events) {
      if (!grouped[event.type]) grouped[event.type] = [];
      grouped[event.type].push(event);
    }
    return grouped;
  }, [events]);

  return {
    events,
    connected,
    error,
    totals,
    transactionsByType,
    clearEvents,
    disconnect,
    reconnect: connect,
  };
}

/**
 * useOptimisticMutation - For UI updates
 * Handles drag-to-update operations with rollback on failure
 */
export function useOptimisticMutation() {
  const [mutating, setMutating] = useState(false);

  const mutate = useCallback(
    async (
      url: string,
      method: string,
      body: unknown,
      onOptimistic: () => void,
      onRevert: (error: Error) => void
    ) => {
      setMutating(true);

      // Optimistic update
      onOptimistic();

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (data.error) throw new Error(data.error);
      } catch (e) {
        onRevert(e as Error);
      } finally {
        setMutating(false);
      }
    },
    []
  );

  return { mutate, mutating };
}

/**
 * useKanban - Drag-and-drop Kanban for pipeline management
 */
export function useKanban(initialData: Record<string, unknown[]> = {}) {
  const [columns, setColumns] = useState(initialData);
  const { mutate, mutating } = useOptimisticMutation();

  const moveCard = useCallback(
    async (cardId: string, newColumn: string, oldColumn: string) => {
      // Optimistic move
      const newCols = { ...columns };

      let card: unknown;
      for (const col of Object.keys(newCols)) {
        newCols[col] = newCols[col].filter((c: unknown) => {
          if ((c as { id: string }).id === cardId) {
            card = c;
            return false;
          }
          return true;
        });
      }

      if (card && newCols[newColumn]) {
        newCols[newColumn] = [...newCols[newColumn], card];
      }

      setColumns(newCols);

      // Server update
      await mutate(
        `/api/crm/opportunities/${cardId}`,
        "PATCH",
        { stage: newColumn },
        () => {},
        () => {
          // Revert on error
          setColumns(columns);
        }
      );
    },
    [columns, mutate]
  );

  return { columns, setColumns, moveCard, mutating };
}

/**
 * useSubscription - For recurring billing/subscriptions
 */
export function useSubscription() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const subscribe = useCallback(async (customerId: string, priceId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, priceId }),
      });
      const data = await res.json();
      setActive(!!data.subscription);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(async (subscriptionId: string) => {
    setLoading(true);
    try {
      await fetch(`/api/billing/subscriptions/${subscriptionId}`, { method: "DELETE" });
      setActive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { active, loading, subscribe, cancel };
}