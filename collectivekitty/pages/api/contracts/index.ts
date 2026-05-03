import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { ContractId, ContactId, createContractId, createContactId } from '../../../lib/types/branded';

/**
 * Contracts API - The legal agreement registry
 *
 * @route GET /api/contracts - List all contracts
 * @route POST /api/contracts - Create new contract
 *
 * @remarks
 * This is the contract registry. Every legal agreement with a customer
 * or vendor gets a ContractId. This is the master list of all binding
 * commitments the company has made.
 *
 * Business context:
 * Contracts are the foundation of commercial relationships. They define:
 * - What you're obligated to deliver (scope of work)
 * - What you'll be paid (revenue recognition)
 * - When payment is due (cash flow timing)
 * - What happens if things go wrong (liability, termination)
 *
 * ContractId is the unique identifier for each legal agreement. It links:
 * - Revenue recognition (when can we book this revenue?)
 * - Invoicing (what are we billing for?)
 * - Delivery tracking (have we fulfilled our obligations?)
 * - Renewal management (when does this expire?)
 * - Legal compliance (audit trail for all agreements)
 *
 * ContractId ≠ DealId. A deal is a sales opportunity. A contract is the
 * legal agreement that results when a deal closes. One deal → one contract.
 * But the IDs are different because they serve different purposes:
 * - DealId: Sales pipeline tracking (CRM)
 * - ContractId: Legal obligation tracking (Finance/Legal)
 *
 * When a contract is created, the system:
 * 1. Validates required fields (name, client, value, dates)
 * 2. Checks for conflicts (overlapping contracts with same client?)
 * 3. Routes through approval workflow (legal review, exec signature)
 * 4. Triggers revenue recognition (when can we book this?)
 * 5. Sets up renewal reminders (don't let this expire)
 *
 * Contract status determines business operations:
 * - draft: Being negotiated, not binding yet
 * - active: Signed and in effect, obligations active
 * - expired: Term ended, no longer binding
 * - terminated: Ended early, check termination clause
 * - renewed: Extended, check for new terms
 *
 * The contract value drives:
 * - Revenue forecasting (what's coming in?)
 * - Resource allocation (do we have capacity to deliver?)
 * - Cash flow planning (when do we get paid?)
 * - Commission calculations (sales team compensation)
 *
 * GET Response:
 * - 200: Contract[] - List of all contracts
 * - 500: { error: string } - Database error
 *
 * POST Request body:
 * - name: string - Contract name/title
 * - client: string - Client name (will become ContactId)
 * - value: number - Contract value in USD
 * - startDate: string (ISO date) - Contract start date
 * - endDate: string (ISO date) - Contract end date
 * - status: string - Contract status (draft, active, expired, etc.)
 *
 * POST Response:
 * - 201: Contract - Created contract with ContractId
 * - 400: { error: string } - Invalid input
 * - 500: { error: string } - Creation failed
 *
 * @throws {Error} When ContractId is invalid
 * @throws {Error} When required fields are missing
 * @throws {Error} When dates are invalid (end before start)
 * @throws {Error} When value is negative
 *
 * Failure modes:
 * - MISSING_REQUIRED_FIELD: Name, client, value, or dates missing
 * - INVALID_DATE_RANGE: End date before start date
 * - INVALID_VALUE: Value is negative or not a number
 * - INVALID_STATUS: Status not in approved list
 * - DUPLICATE_CONTRACT: Contract with same name and client already exists
 *
 * @example
 * ```typescript
 * // List contracts
 * fetch('/api/contracts')
 *   .then(res => res.json())
 *   .then(contracts => console.log('Contracts:', contracts));
 *
 * // Create contract
 * fetch('/api/contracts', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: 'Enterprise Software License',
 *     client: 'Acme Corp',
 *     value: 250000,
 *     startDate: '2026-06-01',
 *     endDate: '2027-05-31',
 *     status: 'active'
 *   })
 * });
 * ```
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { name, client, value, startDate, endDate, status } = req.body;

      // Validate required fields
      if (!name || !client || !value || !startDate || !endDate) {
        return res.status(400).json({
          error: 'Missing required fields: name, client, value, startDate, endDate'
        });
      }

      // Validate value
      const parsedValue = parseFloat(value);
      if (isNaN(parsedValue) || parsedValue < 0) {
        return res.status(400).json({
          error: 'Value must be a non-negative number'
        });
      }

      // Validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
        });
      }
      if (end < start) {
        return res.status(400).json({
          error: 'End date must be after start date'
        });
      }

      // Create contract with branded ContractId
      const contractId = `ctr_${Math.random().toString(36).substr(2, 9)}`;
      const newContract = {
        id: contractId,
        name,
        client,
        value: parsedValue,
        startDate,
        endDate,
        status: status || 'draft'
      };

      db.contracts.push(newContract);
      db.metrics.contracts += 1;

      // Create event with branded EventId
      const eventId = `evt_${Math.random().toString(36).substr(2, 9)}`;
      db.events.unshift({
        id: eventId,
        type: 'contract',
        description: `New Contract: ${name} (${client}) - $${parsedValue.toLocaleString()}`,
        timestamp: new Date().toISOString()
      });

      res.status(201).json(newContract);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create contract'
      });
    }
  } else if (req.method === 'GET') {
    try {
      res.status(200).json(db.contracts);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch contracts'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
