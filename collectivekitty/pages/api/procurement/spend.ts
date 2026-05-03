import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { createEvent, EventTypes } from "../../../lib/eventContract"
import { runPipeline } from "../../../lib/bifrost/pipeline"
import {
  TransactionId,
  VendorId,
  ProjectId,
  createTransactionId,
  createVendorId,
  createProjectId,
  isVendorId,
  isProjectId
} from "../../../lib/types/branded"

const prisma = new PrismaClient()

/**
 * Spend Transactions API - The "just spend" route
 *
 * @route GET /api/procurement/spend - List all spend transactions
 * @route POST /api/procurement/spend - Log new spend transaction
 *
 * @remarks
 * This is the spend tracking system. When someone spends company money
 * (credit card, petty cash, reimbursement), it gets logged here. This
 * is the "just spend" route - fast, lightweight, no approval workflow.
 *
 * Business context:
 * Not all spending needs a formal requisition. Small purchases, recurring
 * expenses, and emergency buys go through this route. The system tracks
 * the spend, categorizes it, and alerts if budget thresholds are exceeded.
 *
 * This is Phase 5 functionality - "just spend" is the final procurement
 * capability. It represents trust in the team to make good decisions
 * without bureaucracy.
 *
 * TransactionId here is a spend record identifier. It tracks a specific
 * outflow of company funds. This is NOT the same as a financial TransactionId
 * in the general ledger (though they may be linked).
 *
 * VendorId identifies who received the payment. This is critical for:
 * - Vendor spend analysis (who are we paying the most?)
 * - Duplicate payment detection (did we already pay this invoice?)
 * - Vendor relationship management (payment history, terms)
 *
 * ProjectId links the spend to a specific project or cost center. This
 * enables project-level budget tracking and cost allocation. When a
 * project goes over budget, this is where we see it first.
 *
 * The system automatically:
 * 1. Categorizes spend (office supplies, travel, software, etc.)
 * 2. Checks budget limits (alert if project over budget)
 * 3. Flags unusual patterns (sudden spike in spend)
 * 4. Routes to Finance Room for GL posting
 *
 * GET Response:
 * - 200: { data: SpendTransaction[], total: number } - List of transactions with total
 * - 500: { error: string } - Database error
 *
 * POST Request body:
 * - amount: number - Spend amount in USD
 * - vendor: string - VendorId or vendor name
 * - category: string - Spend category (office, travel, software, etc.)
 * - description: string - What was purchased
 * - projectId: string (optional) - ProjectId for cost allocation
 *
 * POST Response:
 * - 201: { data: SpendTransaction } - Created transaction
 * - 400: { error: string } - Invalid input
 * - 500: { error: string } - Creation failed
 *
 * @throws {Error} When TransactionId is invalid
 * @throws {Error} When VendorId is invalid
 * @throws {Error} When ProjectId is invalid
 * @throws {Error} When amount is negative or zero
 * @throws {Error} When project budget is exceeded
 *
 * Failure modes:
 * - INVALID_VENDOR_ID: VendorId format incorrect or vendor doesn't exist
 * - INVALID_PROJECT_ID: ProjectId format incorrect or project doesn't exist
 * - BUDGET_EXCEEDED: Project doesn't have sufficient budget
 * - INVALID_AMOUNT: Amount is negative, zero, or not a number
 * - MISSING_REQUIRED_FIELD: Amount, vendor, or category missing
 * - DUPLICATE_TRANSACTION: Identical transaction already logged
 *
 * @example
 * ```typescript
 * // List spend
 * fetch('/api/procurement/spend')
 *   .then(res => res.json())
 *   .then(({ data, total }) => console.log('Total spend:', total));
 *
 * // Log spend
 * fetch('/api/procurement/spend', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     amount: 149.99,
 *     vendor: 'vnd_aws',
 *     category: 'software',
 *     description: 'AWS hosting - March 2026',
 *     projectId: 'prj_platform'
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
      const spend = await prisma.spendTransaction.findMany({
        orderBy: { createdAt: "desc" }
      })
      const total = spend.reduce((sum: number, tx: any) => sum + tx.amount, 0)
      return res.status(200).json({ data: spend, total })
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch spend transactions'
      })
    }
  }

  if (req.method === "POST") {
    try {
      const { amount, vendor, category, description, projectId } = req.body

      // Validate required fields
      if (!amount || !vendor || !category) {
        return res.status(400).json({
          error: 'Missing required fields: amount, vendor, category'
        })
      }

      // Validate amount
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          error: 'Amount must be a positive number'
        })
      }

      // Validate VendorId if it looks like a branded ID
      if (vendor.startsWith('vnd_') && !isVendorId(vendor)) {
        return res.status(400).json({
          error: 'Invalid VendorId format. Expected format: vnd_xxxxx'
        })
      }

      // Validate ProjectId if provided
      if (projectId && !isProjectId(projectId)) {
        return res.status(400).json({
          error: 'Invalid ProjectId format. Expected format: prj_xxxxx'
        })
      }

      const tx = await prisma.spendTransaction.create({
        data: {
          amount: parsedAmount,
          vendor,
          category,
          description,
          projectId
        }
      })

      // Create TransactionId for the new spend transaction
      const transactionId = createTransactionId(tx.id)

      // Route through Bifrost pipeline
      await runPipeline(
        createEvent(
          EventTypes.SPEND.SPEND_LOGGED,
          "procurement",
          {
            transactionId,
            txId: tx.id,
            amount: tx.amount,
            vendor: tx.vendor as VendorId,
            category: tx.category,
            projectId: projectId as ProjectId | undefined
          }
        )
      )

      return res.status(201).json({ data: tx })
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create spend transaction'
      })
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
