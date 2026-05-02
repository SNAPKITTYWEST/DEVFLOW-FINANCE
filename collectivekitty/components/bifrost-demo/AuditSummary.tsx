import { SimulationResult } from "./types"

export function AuditSummary({ result }: { result: SimulationResult }) {
  const isSuccess = result.finalStatus === "SUCCESS"
  
  return (
    <div style={{marginTop:"20px"}}>
      <div style={{
        background:"#050505",
        border:`1px solid ${isSuccess ? "#00FF88" : "#EF4444"}`,
        borderRadius:"8px",
        padding:"16px",
        fontFamily:"monospace",
        fontSize:"12px"
      }}>
        <div style={{
          color: isSuccess ? "#00FF88" : "#EF4444",
          fontWeight:"bold",
          marginBottom:"12px"
        }}>
          {isSuccess ? "✅ FINAL STATE" : "❌ PIPELINE FAILED"}
        </div>
        <div style={{color:"#A1A1AA"}}>
          <div>STATUS: <span style={{color: isSuccess ? "#00FF88" : "#EF4444"}}>
            {result.finalStatus}
          </span></div>
          <div>Pipeline: <span style={{color:"#fff"}}>{result.eventConfig.pipeline}</span></div>
          <div>Duration: <span style={{color:"#fff"}}>{result.eventConfig.totalDuration}ms</span></div>
          <div>Risk Score: <span style={{color:"#fff"}}>
            {result.eventConfig.score}/100 — {result.eventConfig.riskLevel}
          </span></div>
          <div>Deterministic: <span style={{color:"#00FF88"}}>
            {result.isDuplicate ? "DUPLICATE DETECTED — Skipped" : "Same input = same output"}
          </span></div>
          {result.eventConfig.flags.length > 0 && (
            <div style={{marginTop:"8px"}}>
              Flags: {result.eventConfig.flags.map((f, i) => (
                <span key={i} style={{
                  background:"rgba(124,58,237,0.2)",
                  color:"#A855F7",
                  padding:"2px 6px",
                  borderRadius:"3px",
                  fontSize:"10px",
                  marginRight:"4px"
                }}>
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
