import { BifrostEvent } from "../eventContract"

export interface RouteDecision {
  notify: boolean
  requiresApproval: boolean
  escalate: boolean
  nextAction: string
}

export function routeEvent(
  event: BifrostEvent,
  riskLevel: string
): RouteDecision {
  const decisions: RouteDecision = {
    notify: false,
    requiresApproval: false,
    escalate: false,
    nextAction: "persist"
  }

  if (riskLevel === "HIGH" || riskLevel === "CRITICAL") {
    decisions.notify = true
    decisions.requiresApproval = true
    decisions.escalate = true
    decisions.nextAction = "escalate"
  }

  if (event.event_type === "requisition.created") {
    const amount = Number(event.payload.amount || 0)
    if (amount >= 1000) {
      decisions.requiresApproval = true
      decisions.nextAction = "pending_approval"
    }
  }

  return decisions
}
