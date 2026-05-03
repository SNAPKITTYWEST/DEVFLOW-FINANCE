import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { DealId, ContactId, UserId, DealStage, createDealId, isDealStage, unwrapId } from "../../../lib/types/branded";

/**
 * CRM Opportunities API - Revenue pipeline management
 *
 * @route GET /api/crm/opportunities - List all deals
 * @route POST /api/crm/opportunities - Create a new deal
 * @route PATCH /api/crm/opportunities - Update deal stage
 *
 * @remarks
 * This is the revenue pipeline. Every deal, every contact, every opportunity
 * that Edualc is building UI for - this is the API behind it.
 *
 * Business context:
 * The DealId and ContactId branded here are the anchors of a company's entire
 * commercial intelligence. When a sales rep moves a deal from "prospecting" to
 * "active" in Edualc's PipelineView, this endpoint processes that change.
 *
 * Your types here are Edualc's contract. Do not drift from branded.ts.
 * If DealId changes shape, Edualc's entire PipelineView breaks.
 *
 * Deal stages (from branded.ts DealStage):
 * - prospecting: Initial contact, qualification phase
 * - active: Engaged, moving through sales process
 * - closed-won: Deal successfully closed
 * - closed-lost: Deal lost to competitor or no decision
 * - at-risk: Active deal showing warning signs
 *
 * GET Response:
 * - 200: { data: Deal[] } - List of all deals
 * - 500: { data: [], error: string } - Database query failed
 *
 * POST Request body:
 * - name: string - Deal name
 * - company: string - Company name
 * - value: number - Deal value in dollars
 * - stage: DealStage (optional, default: "prospecting")
 * - contactId: string (optional) - Associated contact
 * - ownerId: string (optional) - Sales rep owner
 *
 * POST Response:
 * - 201: { data: Deal } - Created deal with DealId
 * - 400: { error: string } - Invalid deal data
 * - 500: { error: string } - Deal creation failed
 *
 * PATCH Request body:
 * - id: string - DealId to update
 * - stage: DealStage - New stage
 *
 * PATCH Response:
 * - 200: { data: Deal } - Updated deal
 * - 400: { error: string } - Invalid id or stage
 * - 404: { error: string } - Deal not found
 * - 500: { error: string } - Update failed
 *
 * @throws {Error} When DealId is invalid
 * @throws {Error} When DealStage is not in enum
 * @throws {Error} When required fields are missing
 *
 * Failure modes:
 * - INVALID_DEAL_ID: DealId format incorrect
 * - INVALID_STAGE: Stage not in DealStage enum
 * - DEAL_NOT_FOUND: No deal exists with given ID
 * - NEGATIVE_VALUE: Deal value cannot be negative
 *
 * @example
 * ```typescript
 * // List deals
 * fetch('/api/crm/opportunities')
 *   .then(res => res.json())
 *   .then(({ data }) => console.log(`${data.length} deals in pipeline`));
 *
 * // Create deal
 * fetch('/api/crm/opportunities', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: 'Enterprise License',
 *     company: 'Acme Corp',
 *     value: 50000,
 *     stage: 'prospecting'
 *   })
 * });
 *
 * // Move deal to next stage
 * fetch('/api/crm/opportunities', {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     id: 'deal_abc123',
 *     stage: 'active'
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
      const deals = await prisma.deal.findMany({
        orderBy: { createdAt: "desc" }
      });
      
      // Transform to include branded types
      const dealsWithBrandedIds = deals.map(deal => ({
        ...deal,
        id: createDealId(deal.id)
      }));
      
      return res.status(200).json({ data: dealsWithBrandedIds });
    } catch (error) {
      return res.status(500).json({
        data: [],
        error: error instanceof Error ? error.message : "Database error"
      });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, company, value, stage, contactId, ownerId } = req.body;

      // Validate required fields
      if (!name || !company) {
        return res.status(400).json({
          error: "Missing required fields: name, company"
        });
      }

      // Validate stage if provided
      if (stage && !isDealStage(stage)) {
        return res.status(400).json({
          error: `Invalid stage. Must be one of: prospecting, active, closed-won, closed-lost, at-risk`
        });
      }

      // Validate value
      const parsedValue = parseFloat(value) || 0;
      if (parsedValue < 0) {
        return res.status(400).json({
          error: "Deal value cannot be negative"
        });
      }

      const deal = await prisma.deal.create({
        data: {
          name,
          company,
          value: parsedValue,
          stage: (stage as DealStage) || "prospecting",
        },
      });

      return res.status(201).json({
        data: {
          ...deal,
          id: createDealId(deal.id)
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to create deal"
      });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { id, stage } = req.body;

      // Validate required fields
      if (!id || !stage) {
        return res.status(400).json({
          error: "Missing required fields: id, stage"
        });
      }

      // Validate stage
      if (!isDealStage(stage)) {
        return res.status(400).json({
          error: `Invalid stage. Must be one of: prospecting, active, closed-won, closed-lost, at-risk`
        });
      }

      const dealId: DealId = createDealId(id);

      const deal = await prisma.deal.update({
        where: { id: unwrapId(dealId) },
        data: { stage: stage as DealStage },
      });

      return res.status(200).json({
        data: {
          ...deal,
          id: dealId
        }
      });
    } catch (error) {
      // Check if deal not found
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return res.status(404).json({
          error: "Deal not found"
        });
      }
      
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to update deal"
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
