/**
 * Bifrost Standard v1.0 - Event Schema
 *
 * @remarks
 * This schema defines the contract for all events flowing through the Bifrost pipeline.
 * Bifrost is the hallway - it routes events but does not own business logic.
 */

import { EventType, TraceId } from '../types/branded';

/**
 * Standard event structure for the Bifrost pipeline
 *
 * @property event_type - Namespaced event identifier (e.g., "deal.created", "payment.received")
 * @property source - System that originated the event (e.g., "crm", "stripe", "opencollective")
 * @property payload - Event-specific data, validated by the receiving system
 * @property timestamp - ISO 8601 timestamp of event creation
 * @property trace_id - Unique identifier tracking the event through the entire pipeline
 * @property version - Bifrost protocol version (currently "1.0")
 *
 * @example
 * ```typescript
 * const event: BifrostEvent = {
 *   event_type: "deal.created",
 *   source: "crm",
 *   payload: { dealId: "deal_123", amount: 50000 },
 *   timestamp: new Date().toISOString(),
 *   trace_id: createTraceId(crypto.randomUUID()),
 *   version: "1.0"
 * };
 * ```
 */
export interface BifrostEvent {
  event_type: EventType;
  source: string;
  payload: Record<string, unknown>;
  timestamp: string;
  trace_id: TraceId;
  version: string;
}

export const BIFROST_VERSION = "1.0";

export const EventTypes = {
  CRM: {
    DEAL_CREATED:        "deal.created",
    DEAL_STAGE_CHANGED: "deal.stage_changed",
    DEAL_CLOSED:         "deal.closed",
  },
  PROCUREMENT: {
    REQUISITION_CREATED: "requisition.created",
    REQUISITION_APPROVED: "requisition.approved",
    REQUISITION_REJECTED: "requisition.rejected",
    PO_CREATED:          "po.created",
    PO_RECEIVED:         "po.received",
    VENDOR_ADDED:        "vendor.added",
  },
  FINANCE: {
    INVOICE_CREATED:     "invoice.created",
    PAYMENT_SENT:        "payment.sent",
    PAYMENT_RECEIVED:    "payment.received",
  },
  SPEND: {
    SPEND_LOGGED:        "spend.logged",
    SPEND_FLAGGED:       "spend.flagged",
  },
  SYSTEM: {
    BIFROST_INGESTED:    "bifrost.ingested",
    BIFROST_SCORED:      "bifrost.scored",
    AUDIT_TRIGGERED:     "audit.triggered"
  }
} as const;
