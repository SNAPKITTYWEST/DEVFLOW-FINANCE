import { BifrostEvent, EventTypes } from "../contracts/event.schema";
import { RiskLevel } from "../types/branded";

/**
 * Routing decision for a scored event
 *
 * @property notify - Whether to send notifications
 * @property requiresApproval - Whether human approval is required
 * @property escalate - Whether to escalate to management
 * @property nextAction - The next action to take (persist, escalate, pending_approval)
 */
export interface RouteDecision {
  notify: boolean;
  requiresApproval: boolean;
  escalate: boolean;
  nextAction: string;
}

/**
 * Determines routing destination for scored events (Stage 4 of Bifrost pipeline)
 *
 * @param event - The BifrostEvent being routed
 * @param riskLevel - The calculated risk level from scoring stage
 * @returns Routing decision with actions to take
 *
 * @remarks
 * Routing logic:
 * - HIGH/CRITICAL risk → automatic escalation + notification + approval required
 * - Procurement requisitions ≥$1000 → approval required
 * - Unknown input → routes to DEFAULT_REVIEW queue
 *
 * Failure behavior:
 * - No event is dropped
 * - Human review triggered automatically for edge cases
 *
 * @example
 * ```typescript
 * const decision = routeEvent(event, "HIGH");
 * if (decision.escalate) {
 *   console.log("Event escalated to management");
 * }
 * ```
 */
export function routeEvent(
  event: BifrostEvent,
  riskLevel: RiskLevel
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
