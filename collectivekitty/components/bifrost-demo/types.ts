export type EventType = "invoice" | "deal" | "vendor"
export type StageStatus = "pending" | "running" | "success" | "failed"
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface TraceLog {
  timestamp: string;
  event: string;
  status: "OK" | "FAILED" | "SKIPPED";
  detail?: string;
}

export interface StageResult {
  stageNumber: number;
  label: string;
  status: StageStatus;
  logs: TraceLog[];
  duration: number;
  successItems: string[];
}

export interface BifrostEventConfig {
  type: EventType;
  label: string;
  amount?: number;
  client?: string;
  pipeline: string;
  score: number;
  riskLevel: RiskLevel;
  flags: string[];
  totalDuration: number;
}

export interface SimulationResult {
  eventId: string;
  traceId: string;
  idempotencyKey: string;
  timestamp: string;
  eventConfig: BifrostEventConfig;
  stages: StageResult[];
  finalStatus: "SUCCESS" | "FAILED";
  isDuplicate: boolean;
}