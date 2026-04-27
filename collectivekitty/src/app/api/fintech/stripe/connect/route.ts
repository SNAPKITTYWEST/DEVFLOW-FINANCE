import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, createEvent, successResponse, errorResponse } from '@/lib/authMiddleware';
import { createConnectAccount, createOnboardingLink, getConnectAccountStatus } from '@/lib/stripeService';

/**
 * STRIPE CONNECT - Sprint 1
 * POST /api/fintech/stripe/connect/onboard
 * GET /api/fintech/stripe/connect/status
 */

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { returnUrl, refreshUrl } = body;
    const orgId = auth.user.orgId || 'default';

    // Get organization
    const org = await prisma.organization.findUnique({ where: { id: orgId } });

    // Create Connect account if not exists
    let stripeAccountId = org?.stripeAccountId;
    if (!stripeAccountId) {
      const account = await createConnectAccount(orgId, auth.user.email || 'admin@example.com');
      stripeAccountId = account.id;
    }

    // Create onboarding link
    const link = await createOnboardingLink(
      orgId,
      stripeAccountId,
      returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings/stripe/return`,
      refreshUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings/stripe/refresh`
    );

    return successResponse({ url: link.url, stripeAccountId });
  } catch (error) {
    return errorResponse('Failed to start Stripe onboarding: ' + error.message);
  }
}

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const orgId = auth.user.orgId || 'default';
    const org = await prisma.organization.findUnique({ where: { id: orgId } });

    if (!org?.stripeAccountId) {
      return successResponse({ onboarded: false, message: 'No Stripe account' });
    }

    const status = await getConnectAccountStatus(org.stripeAccountId);

    return successResponse({
      onboarded: status.chargesEnabled && status.payoutsEnabled,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      requirements: status.requirements,
    });
  } catch (error) {
    return errorResponse('Failed to get Stripe status: ' + error.message);
  }
}