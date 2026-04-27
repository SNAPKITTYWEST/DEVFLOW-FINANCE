import { Configuration, PlaidApi, PlaidEnvironments, PlaidApiApi, Products, CountryCode } from 'plaid';
import { prisma } from '@/lib/prisma';
import { createEvent } from '@/lib/authMiddleware';

const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

/**
 * PLAID SERVICE - Bank Linking
 */

// ============================================================================
// LINK TOKEN
// ============================================================================

async function createLinkToken(userId: string, orgId: string) {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'SnapKitty Sovereign OS',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
    metadata: { orgId },
  });

  return { linkToken: response.data.link_token };
}

// ============================================================================
// EXCHANGE PUBLIC TOKEN
// ============================================================================

async function exchangePublicToken(publicToken: string, userId: string, orgId: string) {
  const response = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });

  const accessToken = response.data.access_token;
  const itemId = response.data.item_id;

  // Store bank link
  const bankLink = await prisma.bankLink.create({
    data: {
      userId,
      orgId,
      itemId,
      accessToken: encrypt(accessToken), // Encrypt before storage
      status: 'active',
    },
  });

  await createEvent('BANK_LINKED', {
    bankLinkId: bankLink.id,
    userId,
    orgId,
  });

  return { bankLinkId: bankLink.id, itemId };
}

// ============================================================================
// SYNC TRANSACTIONS
// ============================================================================

async function syncBankTransactions(bankLinkId: string) {
  const bankLink = await prisma.bankLink.findUnique({
    where: { id: bankLinkId },
  });

  if (!bankLink || bankLink.status !== 'active') {
    throw new Error('Bank link not found or inactive');
  }

  const accessToken = decrypt(bankLink.accessToken);

  // Get transactions
  const cursor = bankLink.cursor || '';
  const response = await plaidClient.transactionsSync({
    access_token: accessToken,
    cursor,
  });

  const { added, modified, removed, next_cursor } = response.data;

  // Process new transactions
  const transactions = [];
  
  for (const txn of added) {
    const transaction = await prisma.bankTransaction.upsert({
      where: { transactionId: txn.transaction_id },
      update: {
        amount: txn.amount,
        date: new Date(txn.date),
        name: txn.name,
        merchantName: txn.merchant_name,
        category: txn.category?.[0],
        pending: txn.pending,
      },
      create: {
        bankLinkId,
        transactionId: txn.transaction_id,
        amount: txn.amount,
        date: new Date(txn.date),
        name: txn.name,
        merchantName: txn.merchant_name,
        category: txn.category?.[0],
        pending: txn.pending,
        currency: 'USD',
      },
    });
    transactions.push(transaction);
  }

  // Update cursor
  await prisma.bankLink.update({
    where: { id: bankLinkId },
    data: { cursor: next_cursor },
  });

  // Update balance
  if (response.data.has_more) {
    // More pending - schedule another sync
    await createEvent('BANK_SYNC_PENDING', { bankLinkId });
  }

  return {
    added: transactions.length,
    modified: modified.length,
    removed: removed.length,
    cursor: next_cursor,
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

async function healthCheck(bankLinkId: string) {
  const bankLink = await prisma.bankLink.findUnique({
    where: { id: bankLinkId },
  });

  if (!bankLink) {
    return { status: 'not_found' };
  }

  try {
    const accessToken = decrypt(bankLink.accessToken);
    const response = await plaidClient.itemGet({
      access_token: accessToken,
    });

    return {
      status: response.data.item.status === 'connected' ? 'active' : 'error',
      lastSync: bankLink.lastSyncAt,
    };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function encrypt(text: string): string {
  // In production, use proper encryption (AES-256)
  return Buffer.from(text).toString('base64');
}

function decrypt(text: string): string {
  return Buffer.from(text, 'base64').toString('utf-8');
}

export {
  createLinkToken,
  exchangePublicToken,
  syncBankTransactions,
  healthCheck,
  encrypt,
  decrypt,
};