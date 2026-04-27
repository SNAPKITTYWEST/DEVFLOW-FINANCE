import { prisma } from '@/lib/prisma';
import { createEvent, encrypt, decrypt } from '@/lib/authMiddleware';

/**
 * UNIT SERVICE - Virtual Accounts & Cards
 * https://docs.unit.io
 */

const UNIT_API_URL = 'https://api.unit.io/sandbox';
const UNIT_API_KEY = process.env.UNIT_API_KEY;

/**
 * CREATE INDIVIDUAL ACCOUNT
 */
async function createIndividualAccount(data: {
  userId: string;
  orgId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}) {
  const response = await fetch(`${UNIT_API_URL}/accounts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UNIT_API_KEY}`,
      'Content-Type': 'application/vnd.api+json`,
    },
    body: JSON.stringify({
      data: {
        type: 'individualAccount',
        attributes: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: { countryCode: '1', number: data.phone },
          address: {
            street: data.address,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            country: 'US',
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create Unit account');
  }

  const account = await response.json();

  // Store in DB
  await prisma.virtualAccount.create({
    data: {
      userId: data.userId,
      orgId: data.orgId,
      unitAccountId: account.data.id,
      type: 'individual',
      status: 'active',
    },
  });

  return account.data;
}

/**
 * ISSUE VIRTUAL CARD
 */
async function createVirtualCard(data: {
  accountId: string;
  userId: string;
  orgId: string;
  limit?: number;
}) {
  const response = await fetch(`${UNIT_API_URL}/cards`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UNIT_API_KEY}`,
      'Content-Type': 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'virtualCard',
        attributes: {
          accountId: data.accountId,
          state: 'active',
          spendingLimit: data.limit ? { amount: data.limit, window: 'monthly' } : undefined,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create virtual card');
  }

  const card = await response.json();

  // Store in DB
  await prisma.virtualCard.create({
    data: {
      accountId: data.accountId,
      userId: data.userId,
      orgId: data.orgId,
      unitCardId: card.data.id,
      lastFour: card.data.attributes.lastFourDigit,
      expiryMonth: card.data.attributes.expirationMonth,
      expiryYear: card.data.attributes.expirationYear,
      status: 'active',
    },
  });

  return card.data;
}

/**
 * HANDLE UNIT WEBHOOK
 */
async function handleUnitWebhook(event: any) {
  const { type, data } = event;

  switch (type) {
    case 'cardTransaction.created': {
      const { cardId, amount, status } = data.attributes;
      
      await prisma.cardTransaction.create({
        data: {
          unitTransactionId: data.id,
          cardId,
          amount: amount / 100,
          type: data.attributes.type,
          status,
          direction: data.attributes.direction,
        },
      });

      await createEvent('CARD_TRANSACTION', {
        cardId,
        amount,
        status,
      });
      break;
    }

    case 'card.created':
    case 'card.activated': {
      await prisma.virtualCard.update({
        where: { unitCardId: data.id },
        data: { status: 'active' },
      });
      break;
    }

    case 'card.deactivated': {
      await prisma.virtualCard.update({
        where: { unitCardId: data.id },
        data: { status: 'inactive' },
      });
      break;
    }
  }

  return { processed: true };
}

export { createIndividualAccount, createVirtualCard, handleUnitWebhook };