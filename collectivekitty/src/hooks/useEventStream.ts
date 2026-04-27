"use client";

import { useEffect, useState, useCallback, useRef } from "react";

/**
 * useEventStream - Sprint 3
 * Connects to SSE for real-time updates
 */
export function useEventStream(url: string = "/api/events/stream") {
  const [events, setEvents] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    
    try {
      eventSourceRef.current = new EventSource(url);
      
      eventSourceRef.current.onopen = () => {
        setConnected(true);
        setError(null);
      };
      
      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setEvents((prev) => [data, ...prev].slice(0, 50));
        } catch (e) {
          console.error("SSE parse error:", e);
        }
      };
      
      eventSourceRef.current.onerror = () => {
        setConnected(false);
        setError("Connection lost");
        // Retry after 3s
        setTimeout(connect, 3000);
      };
    } catch (e) {
      setError("Failed to connect");
    }
  }, [url]);

  useEffect(() => {
    connect();
    
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    setConnected(false);
  }, []);

  return { events, connected, error, disconnect };
}

/**
 * useOptimisticMutation - Sprint 3
 * For drag-to-update in Kanban board
 */
export function useOptimisticMutation() {
  const [mutating, setMutating] = useState(false);

  const mutate = useCallback(async (
    url: string,
    method: string,
    body: any,
    onOptimistic: (data: any) => void,
    onRevert: (error: any) => void
  ) => {
    setMutating(true);
    
    // Get token
    const token = typeof window !== "undefined" 
      ? localStorage.getItem("auth_token") 
      : null;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body),
        cache: "no-store"
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update with server response
      onOptimistic(data.data);
    } catch (error) {
      // Revert on error
      onRevert(error);
    } finally {
      setMutating(false);
    }
  }, []);

  return { mutate, mutating };
}

/**
 * useKanban - Complete Kanban hook
 */
export function useKanban(initialData: any[] = []) {
  const [columns, setColumns] = useState(initialData);
  const { mutate, mutating } = useOptimisticMutation();

  const moveCard = useCallback(async (
    cardId: string,
    newStage: string
  ) => {
    // Optimistic update
    const newColumns = { ...columns };
    let card: any;
    
    for (const stage of Object.keys(newColumns)) {
      newColumns[stage] = newColumns[stage].filter((c: any) => {
        if (c.id === cardId) {
          card = { ...c, stage: newStage };
          return true;
        }
        return false;
      });
    }
    
    if (card) {
      if (!newColumns[newStage]) newColumns[newStage] = [];
      newColumns[newStage].push(card);
    }
    
    setColumns(newColumns);
    
    // Server update
    await mutate(
      `/api/crm/opportunities/${cardId}`,
      "PATCH",
      { stage: newStage },
      () => {}, // Already updated optimistically
      () => {
        // Revert on error - reload from server
        window.location.reload();
      }
    );
  }, [columns, mutate]);

  return { columns, setColumns, moveCard, mutating };
}