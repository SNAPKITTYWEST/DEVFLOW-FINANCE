import { SimulationResult, StageResult } from "./types"

interface TracePanelProps {
  result: SimulationResult;
  activeStage: number;
}

export function TracePanel({ result, activeStage }: TracePanelProps) {
  return (
    <div style={{
      background: "#050505",
      border: "1px solid #1a1a1a",
      borderRadius: "8px",
      padding: "20px",
      fontFamily: "monospace",
      fontSize: "12px"
    }}>
      <div style={{ color: "#7C3AED", marginBottom: "12px", fontSize: "11px" }}>
        🧠 SYSTEM TRACE — REAL-TIME VIEW
      </div>
      <div style={{ color: "#A1A1AA", marginBottom: "16px" }}>
        <div>Event ID: <span style={{color:"#fff"}}>{result.eventId}</span></div>
        <div>Trace ID: <span style={{color:"#fff"}}>{result.traceId}</span></div>
        <div>Idempotency: <span style={{color:"#fff"}}>{result.idempotencyKey}</span></div>
        <div>Timestamp: <span style={{color:"#fff"}}>{result.timestamp}</span></div>
      </div>
      {result.stages.map((stage, i) => (
        <div key={i} style={{
          marginBottom: "16px",
          borderLeft: `2px solid ${i <= activeStage ? "#7C3AED" : "#222"}`,
          paddingLeft: "12px",
          opacity: i <= activeStage ? 1 : 0.3,
          transition: "all 0.4s ease"
        }}>
          <div style={{color:"#fff", fontWeight:"bold", marginBottom:"6px"}}>
            🔹 {stage.label}
          </div>
          {stage.logs.map((log, j) => (
            <div key={j} style={{
              color: log.status === "FAILED" ? "#EF4444" : "#A1A1AA",
              marginBottom: "2px"
            }}>
              [{log.timestamp}] {log.event}
              {log.detail && <span style={{color:"#666"}}> — {log.detail}</span>}
            </div>
          ))}
          {stage.successItems.map((item, j) => (
            <div key={j} style={{color:"#00FF88", marginTop:"4px"}}>
              ✔ {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
