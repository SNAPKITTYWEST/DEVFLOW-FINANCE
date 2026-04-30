export interface BifrostEvent {
  event_type: string      // "invoice.created" | "deal.closed" etc
  source: string          // "crm" | "procurement" | "finance"
  payload: Record<string, unknown>
  timestamp: string       // ISO 8601
  trace_id: string        // unique per request
  version: string         // "1.0"
}

export function createEvent(
  event_type: string,
  source: string,
  payload: Record<string, unknown>
): BifrostEvent {
  return {
    event_type,
    source,
    payload,
    timestamp: new Date().toISOString(),
    trace_id: crypto.randomUUID(),
    version: "1.0"
  }
}

export const EventTypes = {
  // CRM
  DEAL_CREATED:        "deal.created",
  DEAL_STAGE_CHANGED:  "deal.stage_changed",
  DEAL_CLOSED:         "deal.closed",

  // Procurement
  REQUISITION_CREATED: "requisition.created",
  REQUISITION_APPROVED:"requisition.approved",
  REQUISITION_REJECTED:"requisition.rejected",
  PO_CREATED:          "po.created",
  PO_RECEIVED:         "po.received",
  VENDOR_ADDED:        "vendor.added",

  // Finance
  INVOICE_CREATED:     "invoice.created",
  PAYMENT_SENT:        "payment.sent",
  PAYMENT_RECEIVED:    "payment.received",

  // Spend
  SPEND_LOGGED:        "spend.logged",
  SPEND_FLAGGED:       "spend.flagged",

  // System
  BIFROST_INGESTED:    "bifrost.ingested",
  BIFROST_SCORED:      "bifrost.scored",
  AUDIT_TRIGGERED:     "audit.triggered"
} as const
