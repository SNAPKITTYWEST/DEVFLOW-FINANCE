import { useState, useEffect, useRef, useCallback } from 'react';

interface EventRecord {
  id: string;
  type: string;
  timestamp: string;
  actor?: string;
  entity?: string;
  entityId?: string;
  payload: any;
}

interface UseEventStreamReturn {
  events: EventRecord[];
  isConnected: boolean;
  lastUpdated: Date | null;
  reconnect: () => void;
}

export function useEventStream(orgId: string | null): UseEventStreamReturn {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedIdsRef = useRef<Set<string>>(new Set());

  const handleEvent = useCallback((data: EventRecord) => {
    if (processedIdsRef.current.has(data.id)) return;

    processedIdsRef.current.add(data.id);
    setEvents(prev => [data, ...prev].slice(0, 50));
    setLastUpdated(new Date());
  }, []);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/events?orgId=${orgId}`);
        const data: EventRecord[] = await res.json();
        data.forEach(handleEvent);
      } catch (e) {
        console.error("POLLING_ERROR");
      }
    }, 3000);
  }, [orgId, handleEvent]);

  const connect = useCallback(() => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    if (!orgId) return;

    const es = new EventSource(`/api/events/stream?orgId=${orgId}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };

    es.onmessage = (e) => {
      try {
        handleEvent(JSON.parse(e.data));
      } catch (err) {
        console.error("EVENT_PARSE_ERROR");
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      startPolling();
    };
  }, [orgId, handleEvent, startPolling]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [connect]);

  return {
    events,
    isConnected,
    lastUpdated,
    reconnect: connect
  };
}
