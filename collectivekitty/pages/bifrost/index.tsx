import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Donut
} from "recharts";

// Status indicator component
function StatusLight({ label, status, note }: { label: string, status: "ok" | "error" | "loading", note?: string }) {
  const color = status === "ok" ? "#00D4AA" : status === "error" ? "#EF4444" : "#F59E0B";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem" }}>
      <div style={{
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: color,
        boxShadow: status === "ok" ? "0 0 12px rgba(0, 212, 170, 0.6)" : status === "error" ? "0 0 12px rgba(239, 68, 68, 0.6)" : "0 0 12px rgba(245, 158, 11, 0.6)",
        animation: status === "loading" ? "pulse 1.5s ease-in-out infinite" : "none"
      }} />
      <div>
        <div style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 600 }}>{label}</div>
        {note && <div style={{ color: "#71717a", fontSize: "0.75rem" }}>{note}</div>}
      </div>
    </div>
  );
}

// Event type badge colors
const eventTypeColors: Record<string, string> = {
  "crm": "#7C3AED",
  "stripe": "#00D4AA",
  "opencollective": "#F59E0B",
  "plaid": "#3B82F6",
  "quickbooks": "#10B981",
  "bifrost": "#8B5CF6"
};

function EventTypeBadge({ type }: { type: string }) {
  const source = type.split(".")[0] || "bifrost";
  const color = eventTypeColors[source] || "#71717a";
  return (
    <span style={{
      background: `${color}20`,
      color: color,
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "0.75rem",
      fontWeight: 600,
      fontFamily: "monospace",
      border: `1px solid ${color}40`
    }}>
      {type}
    </span>
  );
}

// Score pill component
function ScorePill({ level }: { level: string }) {
  const colors: Record<string, string> = {
    "LOW": "#00D4AA",
    "MEDIUM": "#F59E0B",
    "HIGH": "#F97316",
    "CRITICAL": "#EF4444"
  };
  const color = colors[level] || "#71717a";
  return (
    <span style={{
      background: `${color}20`,
      color: color,
      padding: "2px 8px",
      borderRadius: "12px",
      fontSize: "0.75rem",
      fontWeight: 700,
      border: `1px solid ${color}40`
    }}>
      {level}
    </span>
  );
}

// Flag tag
function FlagTag({ flag }: { flag: string }) {
  return (
    <span style={{
      background: "rgba(124, 58, 237, 0.1)",
      color: "#a78bfa",
      padding: "1px 6px",
      borderRadius: "3px",
      fontSize: "0.65rem",
      fontFamily: "monospace"
    }}>
      {flag}
    </span>
  );
}

export default function BifrostWarRoom() {
  const [healthStatus, setHealthStatus] = useState({
    bifrost: "loading" as const,
    ml: "loading" as const,
    db: "loading" as const,
    events: "loading" as const
  });
  
  const [events, setEvents] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [riskDist, setRiskDist] = useState<any[]>([]);
  const [retries, setRetries] = useState<any[]>([]);
  const pollRef = useRef<NodeJS.Timeout>();

  // Health check
  const checkHealth = async () => {
    const newStatus = { ...healthStatus };
    
    try {
      const res = await fetch("/api/bifrost/health", { signal: AbortSignal.timeout(3000) });
      newStatus.bifrost = res.ok ? "ok" : "error";
    } catch { newStatus.bifrost = "error"; }

    try {
      const mlUrl = process.env.ML_SERVICE_URL || "http://localhost:8001";
      const res = await fetch(`${mlUrl}/health`, { signal: AbortSignal.timeout(3000) });
      newStatus.ml = res.ok ? "ok" : "error";
    } catch { newStatus.ml = "error"; }

    // Check DB via audit endpoint
    try {
      const res = await fetch("/api/bifrost/audit?limit=1", { signal: AbortSignal.timeout(3000) });
      newStatus.db = res.ok ? "ok" : "error";
    } catch { newStatus.db = "error"; }

    // Check if events flowing
    newStatus.events = events.length > 0 ? "ok" : "loading";

    setHealthStatus(newStatus);
  };

  // Fetch data
  const fetchData = async () => {
    try {
      const [auditRes, stagesRes, retriesRes] = await Promise.all([
        fetch("/api/bifrost/audit?limit=20"),
        fetch("/api/bifrost/stages"),
        fetch("/api/bifrost/retries")
      ]);

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setEvents(auditData.data || []);
        if (auditData.data?.length > 0) {
          setHealthStatus(prev => ({ ...prev, events: "ok" }));
        }
      }

      if (stagesRes.ok) {
        const stagesData = await stagesRes.json();
        setStages(stagesData.data || []);
      }

      if (retriesRes.ok) {
        const retriesData = await retriesRes.json();
        setRetries(retriesData.data || []);
      }

      // Calculate risk distribution
      if (events.length > 0) {
        const dist = [
          { name: "LOW", value: 0, color: "#00D4AA" },
          { name: "MEDIUM", value: 0, color: "#F59E0B" },
          { name: "HIGH", value: 0, color: "#F97316" },
          { name: "CRITICAL", value: 0, color: "#EF4444" }
        ];
        events.forEach((e: any) => {
          const level = e.riskScore >= 70 ? "CRITICAL" : e.riskScore >= 50 ? "HIGH" : e.riskScore >= 30 ? "MEDIUM" : "LOW";
          const idx = dist.findIndex(d => d.name === level);
          if (idx >= 0) dist[idx].value++;
        });
        setRiskDist(dist.filter(d => d.value > 0));
      }
    } catch (error) {
      console.error("[WarRoom] Fetch error:", error);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchData();

    pollRef.current = setInterval(() => {
      checkHealth();
      fetchData();
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const pipelineStages = stages.length > 0 ? stages : [
    { name: "Validate", total: 0, successRate: 0, avgLatency: 0 },
    { name: "Enrich", total: 0, successRate: 0, avgLatency: 0 },
    { name: "Classify", total: 0, successRate: 0, avgLatency: 0 },
    { name: "Transform", total: 0, successRate: 0, avgLatency: 0 },
    { name: "Persist", total: 0, successRate: 0, avgLatency: 0 },
    { name: "Notify", total: 0, successRate: 0, avgLatency: 0 },
    { name: "Audit", total: 0, successRate: 0, avgLatency: 0 }
  ];

  return (
    <main style={{ 
      background: "#0a0a0a", 
      color: "#fff", 
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: "100vh"
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #7C3AED; border-radius: 3px; }
        .mono { font-family: 'SF Mono', 'Fira Code', monospace; }
      `}</style>

      {/* Header */}
      <header style={{
        background: "rgba(10, 10, 10, 0.95)",
        borderBottom: "1px solid rgba(124, 58, 237, 0.2)",
        padding: "1.5rem 2rem",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(20px)"
      }}>
        <div style={{ maxWidth: "1800px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>
              <span style={{ color: "#7C3AED" }}>Bifrost</span>
              <span style={{ color: "#fff", marginLeft: "0.5rem" }}>Intelligence Bridge</span>
            </h1>
            <div style={{ color: "#52525b", fontSize: "0.85rem", fontFamily: "monospace" }}>
              v2.2.0 — War Room
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <StatusLight label="Bifrost Bridge" status={healthStatus.bifrost} note="api/health" />
            <StatusLight label="ML Service" status={healthStatus.ml} note={process.env.ML_SERVICE_URL || "localhost:8001"} />
            <StatusLight label="Database" status={healthStatus.db} note="Prisma/PostgreSQL" />
            <StatusLight label="Event Bus" status={healthStatus.events} note="Real-time stream" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: "1800px", margin: "0 auto", padding: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
          
          {/* LEFT PANEL - Live Event Feed */}
          <div style={{
            background: "#111",
            borderRadius: "12px",
            border: "1px solid rgba(124, 58, 237, 0.15)",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                Live Event Feed
              </h2>
              <span style={{ color: "#00D4AA", fontSize: "0.85rem", fontFamily: "monospace" }}>
                {events.length} events
              </span>
            </div>
            <div style={{ maxHeight: "600px", overflowY: "auto", padding: "1rem" }}>
              {events.length === 0 ? (
                <div style={{ color: "#52525b", textAlign: "center", padding: "3rem", fontSize: "0.9rem" }}>
                  Waiting for events...
                </div>
              ) : (
                events.map((event: any, idx: number) => (
                  <div key={idx} style={{
                    padding: "0.75rem",
                    marginBottom: "0.5rem",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "8px",
                    borderLeft: `3px solid ${eventTypeColors[event.source || 'bifrost'] || '#7C3AED'}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <EventTypeBadge type={event.eventType || event.type} />
                      <ScorePill level={
                        event.riskScore >= 70 ? "CRITICAL" : 
                        event.riskScore >= 50 ? "HIGH" : 
                        event.riskScore >= 30 ? "MEDIUM" : "LOW"
                      } />
                    </div>
                    <div style={{ 
                      color: "#71717a", 
                      fontSize: "0.75rem", 
                      fontFamily: "monospace",
                      marginBottom: "0.25rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {event.trace_id || event.id}
                    </div>
                    {event.flags && event.flags.length > 0 && (
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                        {event.flags.map((flag: string, i: number) => (
                          <FlagTag key={i} flag={flag} />
                        ))}
                      </div>
                    )}
                    <div style={{ color: "#52525b", fontSize: "0.7rem", marginTop: "0.5rem" }}>
                      {new Date(event.timestamp || event.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CENTER PANEL - Pipeline Stages */}
          <div style={{
            background: "#111",
            borderRadius: "12px",
            border: "1px solid rgba(124, 58, 237, 0.15)",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid rgba(255,255,255,0.06)"
            }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                Pipeline Stages
              </h2>
            </div>
            <div style={{ padding: "1rem" }}>
              {pipelineStages.map((stage: any, idx: number) => (
                <div key={idx} style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0.75rem",
                  marginBottom: "0.5rem",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "8px"
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginRight: "1rem",
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                      {stage.name}
                    </div>
                    <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.75rem", color: "#71717a" }}>
                      <span>Total: <span style={{ color: "#fff", fontFamily: "monospace" }}>{stage.total || 0}</span></span>
                      <span>Success: <span style={{ 
                        color: (stage.successRate || 0) > 95 ? "#00D4AA" : (stage.successRate || 0) > 80 ? "#F59E0B" : "#EF4444",
                        fontFamily: "monospace" 
                      }}>{(stage.successRate || 0).toFixed(1)}%</span></span>
                      <span>Latency: <span style={{ color: "#fff", fontFamily: "monospace" }}>{stage.avgLatency || 0}ms</span></span>
                    </div>
                  </div>
                  {(stage.lastError || stage.error) && (
                    <div style={{ 
                      background: "rgba(239, 68, 68, 0.1)", 
                      padding: "4px 8px", 
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      color: "#EF4444",
                      maxWidth: "150px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {stage.lastError || stage.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL - Risk Distribution */}
          <div style={{
            background: "#111",
            borderRadius: "12px",
            border: "1px solid rgba(124, 58, 237, 0.15)",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid rgba(255,255,255,0.06)"
            }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                Risk Distribution
              </h2>
            </div>
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {riskDist.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={riskDist}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: "#1a1a1a", 
                          border: "1px solid #333",
                          borderRadius: "8px",
                          color: "#fff"
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem" }}>
                    {riskDist.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ 
                          width: "12px", 
                          height: "12px", 
                          borderRadius: "3px", 
                          background: item.color 
                        }} />
                        <span style={{ color: "#a1a1aa", fontSize: "0.85rem" }}>{item.name}</span>
                        <span style={{ color: "#fff", fontSize: "0.85rem", fontFamily: "monospace", fontWeight: 600 }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ 
                  height: "250px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: "#52525b",
                  fontSize: "0.9rem"
                }}>
                  No risk data yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM - Retry Queue */}
        <div style={{
          background: "#111",
          borderRadius: "12px",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
              Retry Queue
              {retries.length > 0 && (
                <span style={{ 
                  background: "rgba(239, 68, 68, 0.2)", 
                  color: "#EF4444", 
                  padding: "2px 8px", 
                  borderRadius: "10px", 
                  fontSize: "0.75rem", 
                  marginLeft: "0.75rem" 
                }}>
                  {retries.length} pending
                </span>
              )}
            </h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            {retries.length === 0 ? (
              <div style={{ color: "#52525b", textAlign: "center", padding: "2rem", fontSize: "0.9rem" }}>
                No pending retries — all clear!
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Event ID", "Retry Count", "Next Retry", "Last Error", "Action"].map((h) => (
                      <th key={h} style={{ 
                        padding: "0.75rem 1rem", 
                        textAlign: "left", 
                        color: "#71717a", 
                        fontSize: "0.8rem", 
                        fontWeight: 600,
                        fontFamily: "monospace"
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {retries.map((item: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ 
                        padding: "0.75rem 1rem", 
                        fontFamily: "monospace", 
                        fontSize: "0.8rem", 
                        color: "#fff",
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {item.eventId || item.id}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#a1a1aa" }}>
                        <span style={{ 
                          background: item.retryCount > 3 ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                          color: item.retryCount > 3 ? "#EF4444" : "#F59E0B",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600
                        }}>
                          {item.retryCount || 0}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#71717a", fontFamily: "monospace" }}>
                        {item.nextRetry ? new Date(item.nextRetry).toLocaleTimeString() : "—"}
                      </td>
                      <td style={{ 
                        padding: "0.75rem 1rem", 
                        fontSize: "0.8rem", 
                        color: "#EF4444",
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {item.lastError || item.error || "Unknown error"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <button
                          onClick={() => {
                            fetch(`/api/bifrost/retry/${item.eventId || item.id}`, { method: "POST" })
                              .then(() => fetchData());
                          }}
                          style={{
                            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                            color: "#fff",
                            border: "none",
                            padding: "6px 16px",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "transform 0.2s"
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                          onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                          Retry Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
