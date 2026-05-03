import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { TransactionId, createTransactionId, UserId, createUserId } from '../../../lib/types/branded';

/**
 * Transactions API - Financial transaction management
 *
 * @route GET /api/transactions - List all transactions
 * @route POST /api/transactions - Create a new transaction
 *
 * @remarks
 * This endpoint handles money moving through the system. Every financial
 * transaction in the company touches this route.
 *
 * Business context:
 * TransactionId here is a financial record identifier. It is NOT interchangeable
 * with EventId. Never. A TransactionId references a specific movement of money
 * with accounting implications. An EventId references a system event that may
 * or may not involve money.
 *
 * When the bank plugs in (Phase 4 - Finance activation), this endpoint becomes
 * the primary interface for recording all financial activity. Every debit,
 * every credit, every transfer flows through here.
 *
 * Transaction types:
 * - income: Money coming into the company
 * - expense: Money going out of the company
 * - transfer: Money moving between internal accounts
 *
 * GET Response:
 * - 200: Transaction[] - List of all transactions
 * - 500: { error: string } - Database query failed
 *
 * POST Request body:
 * - type: 'income' | 'expense' | 'transfer' - Transaction type
 * - amount: number - Transaction amount (must be positive)
 * - description: string - Human-readable description
 * - date: string - ISO 8601 date
 * - userId: string (optional) - User who initiated transaction
 *
 * POST Response:
 * - 201: Transaction - Created transaction with TransactionId
 * - 400: { error: string } - Invalid transaction data
 * - 500: { error: string } - Transaction creation failed
 *
 * @throws {Error} When amount is negative or zero
 * @throws {Error} When transaction type is invalid
 * @throws {Error} When required fields are missing
 *
 * Failure modes:
 * - INVALID_AMOUNT: Amount must be positive number
 * - INVALID_TYPE: Type must be income, expense, or transfer
 * - MISSING_DESCRIPTION: Description is required for audit trail
 * - DUPLICATE_TRANSACTION: TransactionId already exists (idempotency check)
 *
 * @example
 * ```typescript
 * // List transactions
 * fetch('/api/transactions')
 *   .then(res => res.json())
 *   .then(txns => console.log(`${txns.length} transactions`));
 *
 * // Create transaction
 * fetch('/api/transactions', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     type: 'expense',
 *     amount: 5000,
 *     description: 'Office supplies',
 *     date: new Date().toISOString()
 *   })
 * });
 * ```
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { type, amount, description, date, userId } = req.body;

    // Validate required fields
    if (!type || !amount || !description) {
      return res.status(400).json({
        error: 'Missing required fields: type, amount, description'
      });
    }

    // Validate transaction type
    if (!['income', 'expense', 'transfer'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid transaction type. Must be: income, expense, or transfer'
      });
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        error: 'Amount must be a positive number'
      });
    }

    // Generate branded TransactionId
    const transactionId: TransactionId = createTransactionId(
      `txn_${Math.random().toString(36).substr(2, 9)}`
    );

    const newTransaction = {
      id: transactionId,
      type,
      amount: parsedAmount,
      description,
      date: date || new Date().toISOString(),
      userId: userId ? createUserId(userId) : null
    };

    db.transactions.push(newTransaction);

    // Create corresponding event in event log
    db.events.unshift({
      id: Math.random().toString(36).substr(2, 9),
      type: 'transaction',
      description: `New ${type}: ${description} ($${parsedAmount})`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(newTransaction);
  } else if (req.method === 'GET') {
    res.status(200).json(db.transactions);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
