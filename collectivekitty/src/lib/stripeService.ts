import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { createEvent, successResponse, errorResponse } from '@/lib/authMiddleware';

/**
 * STRIPE SERVICE - All Stripe Operations
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// ============================================================================
// STRIPE CONNECT (Multi-tenant)
// ============================================================================

async function createConnectAccount(orgId: string, email: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    metadata: { orgId },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  // Store on Organization
  await prisma.organization.update({
    where: { id: orgId },
    data: { stripeAccountId: account.id },
  });

  return account;
}

async function createOnboardingLink(orgId: string, accountId: string, returnUrl: string, refreshUrl: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return { url: accountLink.url };
}

async function getConnectAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);

  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    requirements: account.requirements,
    detailsSubmitted: account.details_submitted,
  };
}

// ============================================================================
// PAYMENT INTENTS
// ============================================================================

async function createPaymentIntent(data: {
  amount: number;
  currency: string;
  customerId?: string;
  invoiceId: string;
  orgId: string;
}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(data.amount * 100), // Convert to cents
    currency: data.currency.toLowerCase(),
    customer: data.customerId,
    metadata: {
      invoiceId: data.invoiceId,
      orgId: data.orgId,
    },
    automatic_payment_methods: { enabled: true },
  });

  // Store on Invoice
  await prisma.vendorInvoice.update({
    where: { id: data.invoiceId },
    data: { stripePaymentId: paymentIntent.id },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

// ============================================================================
// PAYMENT LINKS
// ============================================================================

async function createPaymentLink(data: {
  invoiceId: string;
  amount: number;
  description: string;
  orgId: string;
}) {
  const product = await stripe.products.create({
    name: data.description,
    metadata: { invoiceId: data.invoiceId, orgId: data.orgId },
  });

  const price = await stripe.prices.create({
    unit_amount: Math.round(data.amount * 100),
    currency: 'usd',
    product: product.id,
  });

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { invoiceId: data.invoiceId, orgId: data.orgId },
    after_completion: { type: 'redirect', redirect: { url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?invoice=${data.invoiceId}` } },
  });

  // Store in PaymentLink table
  await prisma.paymentLink.create({
    data: {
      invoiceId: data.invoiceId,
      linkId: paymentLink.id,
      url: paymentLink.url,
      amount: data.amount,
      currency: data.currency || 'USD',
      status: 'active',
    },
  });

  return { url: paymentLink.url, linkId: paymentLink.id };
}

// ============================================================================
// INSTANT PAYOUTS
// ============================================================================

async function createPayout(data: {
  vendorId: string;
  amount: number;
  currency: string;
  invoiceId: string;
  orgId: string;
  createdById: string;
}) {
  // Get vendor's Stripe account
  const vendor = await prisma.vendor.findUnique({
    where: { id: data.vendorId },
  });

  if (!vendor?.stripeAccountId) {
    throw new Error('Vendor has no Stripe account for payouts');
  }

  // Create transfer to vendor's connected account
  const transfer = await stripe.transfers.create({
    amount: Math.round(data.amount * 100),
    currency: data.currency.toLowerCase(),
    destination: vendor.stripeAccountId,
    metadata: {
      invoiceId: data.invoiceId,
      vendorId: data.vendorId,
      orgId: data.orgId,
    },
  });

  // Create financial transaction
  const transaction = await prisma.financialTransaction.create({
    data: {
      type: 'PAYOUT',
      amount: data.amount,
      currency: data.currency,
      status: 'completed',
      vendorId: data.vendorId,
      invoiceId: data.invoiceId,
      externalId: transfer.id,
      createdById: data.createdById,
    },
  });

  // Create ledger entries (DR: AP, CR: Cash)
  await prisma.generalLedger.createMany({
    data: [
      {
        orgId: data.orgId,
        entryDate: new Date(),
        description: `Payout to ${vendor.name}`,
        debitAccount: '2000', // Accounts Payable
        creditAccount: '1000', // Cash
        amount: data.amount,
        currency: data.currency,
        sourceType: 'payout',
        sourceId: transaction.id,
        createdById: data.createdById,
      },
    ],
  });

  await createEvent('PAYOUT_SENT', {
    vendorId: data.vendorId,
    amount: data.amount,
    invoiceId: data.invoiceId,
    transferId: transfer.id,
  });

  return { transferId: transfer.id, transactionId: transaction.id };
}

// ============================================================================
// STRIPE CUSTOMERS
// ============================================================================

async function createStripeCustomer(data: {
  companyId: string;
  email: string;
  name: string;
  orgId: string;
}) {
  const customer = await stripe.customers.create({
    email: data.email,
    name: data.name,
    metadata: {
      companyId: data.companyId,
      orgId: data.orgId,
    },
  });

  // Update Company with Stripe customer ID
  await prisma.company.update({
    where: { id: data.companyId },
    data: { stripeCustomerId: customer.id },
  });

  return { stripeCustomerId: customer.id };
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

function constructWebhookEvent(payload: Buffer, signature: string) {
  return stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
}

async function handleWebhookEvent(event: Stripe.Event) {
  const eventType = event.type;
  const data = event.data.object as any;

  // Idempotency: Check if already processed
  if (event.data?.object?.id) {
    const existing = await prisma.financialTransaction.findFirst({
      where: { externalId: event.data.object.id },
    });
    if (existing) {
      return { status: 'already_processed', eventId: event.id };
    }
  }

  switch (eventType) {
    case 'payment_intent.succeeded': {
      const invoiceId = data.metadata?.invoiceId;
      if (invoiceId) {
        await prisma.vendorInvoice.update({
          where: { id: invoiceId },
          data: {
            status: 'paid',
            paidAt: new Date(),
            stripePaymentId: data.id,
          },
        });

        // Create ledger entry
        const invoice = await prisma.vendorInvoice.findUnique({ where: { id: invoiceId } });
        if (invoice) {
          await prisma.generalLedger.create({
            data: {
              orgId: invoice.orgId,
              entryDate: new Date(),
              description: `Payment received: ${data.id}`,
              debitAccount: '1000', // Cash
              creditAccount: '1200', // Accounts Receivable
              amount: invoice.amount,
              currency: invoice.currency,
              sourceType: 'payment',
              sourceId: invoiceId,
              createdById: 'stripe-webhook',
            },
          });
        }

        await createEvent('PAYMENT_RECEIVED', {
          invoiceId,
          amount: data.amount / 100,
          paymentIntentId: data.id,
        });
      }
      break;
    }

    case 'payment_intent.failed': {
      const invoiceId = data.metadata?.invoiceId;
      if (invoiceId) {
        await prisma.vendorInvoice.update({
          where: { id: invoiceId },
          data: { status: 'failed' },
        });

        await createEvent('PAYMENT_FAILED', {
          invoiceId,
          error: data.last_payment_error?.message,
          paymentIntentId: data.id,
        });
      }
      break;
    }

    case 'transfer.created': {
      await prisma.financialTransaction.create({
        data: {
          type: 'TRANSFER',
          amount: data.amount / 100,
          currency: data.currency,
          status: 'completed',
          externalId: data.id,
          metadata: data.metadata,
        },
      });
      break;
    }

    case 'account_updated': {
      const orgId = data.metadata?.orgId;
      if (orgId) {
        const status = await getConnectAccountStatus(data.id);
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            stripeConnectStatus: status,
            stripeChargesEnabled: status.chargesEnabled,
            stripePayoutsEnabled: status.payoutsEnabled,
          },
        });

        await createEvent('STRIPE_ACCOUNT_UPDATED', {
          orgId,
          status,
        });
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const companyId = data.metadata?.companyId;
      if (companyId) {
        await prisma.company.update({
          where: { id: companyId },
          data: {
            subscriptionStatus: eventType.includes('deleted') ? 'canceled' : 'active',
            subscriptionId: data.id,
          },
        });

        await createEvent('SUBSCRIPTION_' + eventType.split('.')[2].toUpperCase(), {
          companyId,
          subscriptionId: data.id,
        });
      }
      break;
    }

    default:
      console.log(`[STRIPE_WEBHOOK] Unhandled event: ${eventType}`);
  }

  return { status: 'processed', eventId: event.id };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  stripe,
  createConnectAccount,
  createOnboardingLink,
  getConnectAccountStatus,
  createPaymentIntent,
  createPaymentLink,
  createPayout,
  createStripeCustomer,
  constructWebhookEvent,
  handleWebhookEvent,
};