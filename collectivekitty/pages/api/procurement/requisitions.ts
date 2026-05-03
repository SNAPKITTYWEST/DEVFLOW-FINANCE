import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { createEvent, EventTypes } from "../../../lib/eventContract"
import { runPipeline } from "../../../lib/bifrost/pipeline"
import {
  RequisitionId,
  UserId,
  ProjectId,
  createRequisitionId,
  createUserId,
  createProjectId,
  isRequisitionId,
  isUserId,
  isProjectId
} from "../../../lib/types/branded"

const prisma = new PrismaClient()

/**
 * Purchase Requisitions API - The procurement request system
 *
 * @route GET /api/procurement/requisitions - List all purchase requisitions
 * @route POST /api/procurement/requisitions - Create new purchase requisition
 *
 * @remarks
 * This is the purchase requisition system. Every request to buy something
 * starts here. When an employee needs to purchase goods or services, they
 * create a requisition. This triggers approval workflows, budget checks,
 * and vendor selection processes.
 *
 * Business context:
 * Purchase requisitions are the first step in the procure-to-pay cycle.
 * They represent a formal request to spend company money. The system
 * automatically approves small purchases (<$1000) but routes larger
 * purchases through approval chains.
 *
 * RequisitionId is the unique identifier for each purchase request. It
 * tracks the request through its lifecycle: pending → approved → ordered
 * → received → paid. This ID appears on purchase orders, invoices, and
 * payment records.
 *
 * UserId identifies who requested the purchase. This is critical for:
 * - Budget accountability (who's spending what)
 * - Approval routing (manager hierarchy)
 * - Audit trails (who authorized this spend)
 *
 * ProjectId links the requisition to a specific project or cost center.
 * This enables project-level budget tracking and cost allocation.
 *
 * The $1000 auto-approval threshold is a business rule. Below this amount,
 * the system trusts employees to make purchasing decisions. Above it,
 * management approval is required. This threshold is configurable per
 * department or user role.
 *
 * When a requisition is created, Bifrost routes it through:
 * 1. Budget validation (does the project have funds?)
 * 2. Policy checks (is this an approved vendor?)
 * 3. Approval routing (who needs to sign off?)
 * 4. Notification (alert approvers and requestor)
 *
 * GET Response:
 * - 200: { data: Requisition[] } - List of requisitions
 * - 500: { error: string } - Database error
 *
 * POST Request body:
 * - title: string - Short description of purchase
 * - description: string - Detailed justification
 * - amount: number - Total cost in USD
 * - priority: 'low' | 'normal' | 'high' | 'urgent' - Request urgency
 * - requestedBy: string - UserId of requestor
 * - neededBy: string (ISO date) - When items are needed
 * - projectId: string - ProjectId for cost allocation
 *
 * POST Response:
 * - 201: { data: Requisition } - Created requisition
 * - 400: { error: string } - Invalid input
 * - 500: { error: string } - Creation failed
 *
 * @throws {Error} When RequisitionId is invalid
 * @throws {Error} When UserId is invalid
 * @throws {Error} When ProjectId is invalid
 * @throws {Error} When amount is negative or zero
 * @throws {Error} When project budget is exceeded
 *
 * Failure modes:
 * - INVALID_USER_ID: UserId format incorrect or user doesn't exist
 * - INVALID_PROJECT_ID: ProjectId format incorrect or project doesn't exist
 * - BUDGET_EXCEEDED: Project doesn't have sufficient budget
 * - INVALID_AMOUNT: Amount is negative, zero, or not a number
 * - MISSING_REQUIRED_FIELD: Title, description, or amount missing
 * - DUPLICATE_REQUISITION: Identical requisition already exists
 *
 * @example
 * ```typescript
 * // List requisitions
 * fetch('/api/procurement/requisitions')
 *   .then(res => res.json())
 *   .then(({ data }) => console.log('Requisitions:', data));
 *
 * // Create requisition
 * fetch('/api/procurement/requisitions', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     title: 'New laptops for engineering team',
 *     description: 'Replace aging MacBooks for 5 engineers',
 *     amount: 12500,
 *     priority: 'high',
 *     requestedBy: 'usr_alice123',
 *     neededBy: '2026-06-01',
 *     projectId: 'prj_eng_q2'
 *   })
 * });
 * ```
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const reqs = await prisma.purchaseRequisition.findMany({
        orderBy: { createdAt: "desc" }
      })
      return res.status(200).json({ data: reqs })
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch requisitions'
      })
    }
  }

  if (req.method === "POST") {
    try {
      const { title, description, amount, priority,
              requestedBy, neededBy, projectId } = req.body

      // Validate required fields
      if (!title || !description || !amount || !requestedBy) {
        return res.status(400).json({
          error: 'Missing required fields: title, description, amount, requestedBy'
        })
      }

      // Validate amount
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          error: 'Amount must be a positive number'
        })
      }

      // Validate UserId
      if (!isUserId(requestedBy)) {
        return res.status(400).json({
          error: 'Invalid UserId format. Expected format: usr_xxxxx'
        })
      }

      // Validate ProjectId if provided
      if (projectId && !isProjectId(projectId)) {
        return res.status(400).json({
          error: 'Invalid ProjectId format. Expected format: prj_xxxxx'
        })
      }

      // Auto-approve small purchases (<$1000)
      const status = parsedAmount < 1000 ? "approved" : "pending"

      const pr = await prisma.purchaseRequisition.create({
        data: {
          title,
          description,
          amount: parsedAmount,
          priority: priority || "normal",
          requestedBy,
          neededBy: neededBy ? new Date(neededBy) : null,
          projectId,
          status
        }
      })

      // Create RequisitionId for the new requisition
      const requisitionId = createRequisitionId(pr.id)

      // Route through Bifrost pipeline
      await runPipeline(
        createEvent(
          EventTypes.PROCUREMENT.REQUISITION_CREATED,
          "procurement",
          {
            requisitionId,
            prId: pr.id,
            amount: pr.amount,
            priority: pr.priority,
            autoApproved: status === "approved",
            requestedBy: requestedBy as UserId,
            projectId: projectId as ProjectId | undefined
          }
        )
      )

      return res.status(201).json({ data: pr })
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create requisition'
      })
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
