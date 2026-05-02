import { useState, useCallback } from "react"
import { 
  BifrostEventConfig, 
  SimulationResult, 
  StageResult,
  EventType 
} from "./types"

const EVENT_CONFIGS: Record<EventType, BifrostEventConfig> = {
  invoice: {
    type: "invoice",
    label: "Invoice Created — $12,500",
    amount: 12500,
    client: "Nova Corp",
    pipeline: "FinancePipeline",
    score: 35,
    riskLevel: "MEDIUM",
    flags: ["HIGH_VALUE"],
    totalDuration: 2110
  },
  deal: {
    type: "deal",
    label: "Deal Closed — Nova Corp",
    client: "Nova Corp",
    pipeline: "CRMPipeline",
    score: 10,
    riskLevel: "LOW",
    flags: [],
    totalDuration: 890
  },
  vendor: {
    type: "vendor",
    label: "Vendor Payment — $5,000",
    amount: 5000,
    pipeline: "ProcurementPipeline",
    score: 45,
    riskLevel: "MEDIUM",
    flags: ["HIGH_VALUE", "VENDOR_PAYMENT"],
    totalDuration: 2010
  }
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 8)}`
}

function formatTimestamp(base: Date, addMs: number): string {
  const d = new Date(base.getTime() + addMs)
  return d.toTimeString().substr(0, 8) + 
    "." + String(d.getMilliseconds()).padStart(3, "0")
}

export function useBifrostSimulation() {
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [activeStage, setActiveStage] = useState(-1)
  const [showFailure, setShowFailure] = useState(false)
  const [lastEventId, setLastEventId] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventType>("invoice")

  const runSimulation = useCallback(async (
    eventType: EventType, 
    simulateFailure: boolean = false
  ) => {
    setIsRunning(true)
    setActiveStage(-1)
    setShowFailure(false)

    const eventId = generateId("evt")
    const traceId = generateId("trace")
    const idempotencyKey = generateId(eventType)
    const now = new Date()
    const config = EVENT_CONFIGS[eventType]

    // Check for duplicate
    if (lastEventId === eventId) {
      setResult(prev => prev ? { ...prev, isDuplicate: true } : null)
      setIsRunning(false)
      return
    }

    const stages: StageResult[] = [
      {
        stageNumber: 1,
        label: "Stage 1 — Intake Service",
        status: "pending",
        logs: [
          { timestamp: formatTimestamp(now, 0), 
            event: "EVENT_RECEIVED", status: "OK",
            detail: `Source: ${eventType}.service` },
          { timestamp: formatTimestamp(now, 112), 
            event: "PERSISTED", status: "OK",
            detail: `ID: ${eventId}` }
        ],
        duration: 112,
        successItems: ["Event normalized into Bifrost schema"]
      },
      {
        stageNumber: 2,
        label: "Stage 2 — Validation Service",
        status: "pending",
        logs: [
          { timestamp: formatTimestamp(now, 329), 
            event: simulateFailure ? "VALIDATION_FAILED" : "VALIDATION_START", 
            status: simulateFailure ? "FAILED" : "OK",
            detail: "Schema: v1" },
          ...(!simulateFailure ? [{
            timestamp: formatTimestamp(now, 500),
            event: "VALIDATION_SUCCESS",
            status: "OK" as const
          }] : [{
            timestamp: formatTimestamp(now, 401),
            event: "EVENT_HALTED",
            status: "FAILED" as const,
            detail: 'Missing required field "amount"'
          }])
        ],
        duration: simulateFailure ? 72 : 171,
        successItems: simulateFailure ? 
          ["No downstream execution", "Failure emitted + logged"] :
          ["Required fields present", "Payload integrity verified"]
      },
      {
        stageNumber: 3,
        label: "Stage 3 — Routing Service",
        status: "pending",
        logs: [
          { timestamp: formatTimestamp(now, 890), 
            event: "ROUTE_COMPUTE", status: "OK",
            detail: `Event: ${eventType}.created` },
          { timestamp: formatTimestamp(now, 1006), 
            event: `ROUTED → ${config.pipeline}`, status: "OK" }
        ],
        duration: 116,
        successItems: ["Deterministic routing rule applied"]
      },
      {
        stageNumber: 4,
        label: "Stage 4 — Execution Service",
        status: "pending",
        logs: [
          { timestamp: formatTimestamp(now, 1779), 
            event: "EXECUTION_START", status: "OK",
            detail: `Target: ${config.pipeline.toLowerCase()}` },
          { timestamp: formatTimestamp(now, 1919), 
            event: "EXECUTION_SUCCESS", status: "OK",
            detail: config.amount ? `Amount: $${config.amount.toLocaleString()}` : undefined }
        ],
        duration: 140,
        successItems: ["Record persisted to database"]
      },
      {
        stageNumber: 5,
        label: "Stage 5 — Audit Service",
        status: "pending",
        logs: [
          { timestamp: formatTimestamp(now, 2001), 
            event: "AUDIT_COMMIT", status: "OK",
            detail: `Hash: 0x${Math.random().toString(16).substr(2, 8).toUpperCase()}` },
          { timestamp: formatTimestamp(now, 2110), 
            event: "TRACE_FINALIZED", status: "OK",
            detail: `Trace: ${traceId}` }
        ],
        duration: 109,
        successItems: [
          "Immutable audit record created",
          "Trace finalized"
        ]
      }
    ]

    const stageCount = simulateFailure ? 2 : stages.length

    for (let i = 0; i < stageCount; i++) {
      await new Promise(r => setTimeout(r, 600))
      setActiveStage(i)
    }

    const simulationResult: SimulationResult = {
      eventId,
      traceId,
      idempotencyKey,
      timestamp: now.toISOString(),
      eventConfig: config,
      stages: stages.slice(0, stageCount),
      finalStatus: simulateFailure ? "FAILED" : "SUCCESS",
      isDuplicate: false
    }

    setResult(simulationResult)
    setLastEventId(eventId)
    if (simulateFailure) setShowFailure(true)
    setIsRunning(false)
  }, [lastEventId])

  return {
    result,
    isRunning,
    activeStage,
    showFailure,
    selectedEvent,
    setSelectedEvent,
    runSimulation
  }
}
