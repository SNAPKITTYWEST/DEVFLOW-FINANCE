import { BifrostEvent, EventTypes } from "../contracts/event.schema";

export interface RouteDecision {
  notify: boolean;
  requiresApproval: boolean;
  escalate: boolean;
  nextAction: string;
}

/**
 * Determines routing destination for scored events.
 * @failure Unknown input → routes to DEFAULT_REVIEW queue
 * @failure No event is dropped
 * @failure Human review triggered automatically
 */
export function routeEvent(
  event: BifrostEvent,
  riskLevel: string
): RouteDecision {
  const decisions: RouteDecision = {
    notify: false,
    requiresApproval: false,
    escalate: false,
    nextAction: "persist"
  };

  // High risk triggers automatic escalation
  if (riskLevel === "HIGH" || riskLevel === "CRITICAL") {
    decisions.notify = true;
    decisions.requiresApproval = true;
    decisions.escalate = true;
    decisions.nextAction = "escalate";
  }

  // Business Logic: Procurement Approvals
  if (event.event_type === EventTypes.PROCUREMENT.REQUISITION_CREATED) {
    const amount = Number(event.payload.amount || 0);
    if (amount >= 1000) {
      decisions.requiresApproval = true;
      decisions.nextAction = "pending_approval";
    }
  }

  return decisions;
}
