import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, successResponse, errorResponse, requireKYC } from '@/lib/authMiddleware';
import { initiateKYC, getKYCStatus } from '@/lib/complianceService';

/**
 * KYC INITIATE - Sprint 4 #18
 * POST /api/fintech/kyc/initiate
 */

export async function POST(request: NextRequest) {
  // Skip regular auth - allow pending users
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { email, firstName, lastName, dateOfBirth, address, city, state, postalCode, ssnLastFour } = body;

    if (!email || !firstName || !lastName) {
      return errorResponse('Missing required fields', 400);
    }

    const orgId = auth.user.orgId || 'default';
    const userId = auth.user.sub;

    const result = await initiateKYC({
      userId,
      orgId,
      email,
      firstName,
      lastName,
      dateOfBirth,
      address,
      city,
      state,
      postalCode,
      ssnLastFour,
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse('Failed to initiate KYC: ' + error.message);
  }
}

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  const kyc = await getKYCStatus(auth.user.sub);

  return successResponse(kyc);
}