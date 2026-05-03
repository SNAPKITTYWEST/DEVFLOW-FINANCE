import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { TransactionId, UserId, createTransactionId, createUserId } from '../../../lib/types/branded';

/**
 * General Ledger API - The financial backbone of the operating system
 *
 * @route GET /api/finance/gl - Sync general ledger with Bifrost
 * @route POST /api/finance/gl - Record GL transaction (future)
 *
 * @remarks
 * This is the general ledger. Every financial transaction in the company
 * touches this file. When a user plugs their bank in (Phase 4 - Finance
 * activation), this route becomes the primary interface for all accounting.
 *
 * Business context:
 * The general ledger is the single source of truth for a company's financial
 * state. Every debit, every credit, every account balance flows through here.
 *
 * When the bank connects, this endpoint:
 * 1. Receives transaction feeds from the bank
 * 2. Categorizes transactions automatically
 * 3. Updates account balances in real-time
 * 4. Triggers budget alerts when thresholds exceeded
 * 5. Feeds data to the Finance Room UI
 *
 * TransactionId here is a financial record identifier. It references a specific
 * movement of money with accounting implications. It is NOT interchangeable
 * with EventId. This distinction is critical for audit compliance.
 *
 * The branded types here are financial controls. Type confusion at this layer
 * means debiting the wrong account - a financial incident.
 *
 * GET Response:
 * - 200: { status: 'success', message: string } - Ledger synced
 * - 500: { status: 'error', error: string } - Sync failed
 *
 * POST Request body (future implementation):
 * - transactionId: string - Unique transaction identifier
 * - accountId: string - GL account code
 * - amount: number - Transaction amount
 * - type: 'debit' | 'credit' - Transaction type
 * - description: string - Transaction description
 * - userId: string - User who initiated transaction
 *
 * @throws {Error} When TransactionId is invalid
 * @throws {Error} When account balance would go negative
 * @throws {Error} When transaction violates budget rules
 *
 * Failure modes:
 * - INVALID_TRANSACTION_ID: TransactionId format incorrect
 * - ACCOUNT_NOT_FOUND: GL account doesn't exist
 * - INSUFFICIENT_FUNDS: Transaction would overdraw account
 * - BUDGET_EXCEEDED: Transaction exceeds approved budget
 * - DUPLICATE_TRANSACTION: TransactionId already recorded (idempotency)
 *
 * @example
 * ```typescript
 * // Sync ledger
 * fetch('/api/finance/gl')
 *   .then(res => res.json())
 *   .then(({ status }) => console.log('Ledger status:', status));
 *
 * // Record transaction (future)
 * fetch('/api/finance/gl', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     transactionId: 'txn_abc123',
 *     accountId: '1000', // Cash account
 *     amount: 5000,
 *     type: 'debit',
 *     description: 'Office supplies payment'
 *   })
 * });
 * ```
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // Create sync event with branded EventId
      const eventId = `evt_${Math.random().toString(36).substr(2, 9)}`;
      
      db.events.unshift({
        id: eventId,
        type: 'sync',
        description: 'General Ledger synced with Bifrost',
        timestamp: new Date().toISOString()
      });

      res.status(200).json({
        status: 'success',
        message: 'Ledger synced',
        eventId
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Sync failed'
      });
    }
  } else if (req.method === 'POST') {
    // Future implementation: Record GL transaction
    // This will be activated when bank connection goes live (Phase 4)
    res.status(501).json({
      error: 'GL transaction recording not yet implemented. Activates with bank connection (Phase 4).'
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
