/**
 * Bifrost Standard v1.0 - Event Schema
 */

export interface BifrostEvent {
  event_type: string;     // e.g., "deal.created", "payment.received"
  source: string;         // e.g., "crm", "stripe", "opencollective"
  payload: Record<string, any>;
  timestamp: string;      // ISO 8601
  trace_id: string;       // Unique trace for the event lifecycle
  version: string;        // "1.0"
}

export const BIFROST_VERSION = "1.0";

export const EventTypes = {
  CRM: {
    DEAL_CREATED: "deal.created",
    DEAL_STAGE_CHANGED: "deal.stage_changed",
    DEAL_CLOSED: "deal.closed",
  },
  PROCUREMENT: {
    REQUISITION_CREATED: "requisition.created",
    REQUISITION_APPROVED: "requisition.approved",
    PO_CREATED: "po.created",
  },
  FINANCE: {
    INVOICE_CREATED: "invoice.created",
    PAYMENT_RECEIVED: "payment.received",
    SPEND_LOGGED: "spend.logged",
  }
} as const;
