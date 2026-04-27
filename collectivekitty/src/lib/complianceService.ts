import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, successResponse, errorResponse } from '@/lib/authMiddleware';

/**
 * COMPLIANCE SERVICE - KYC / AML
 */

async function initiateKYC(data: {
  userId: string;
  orgId: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  ssnLastFour: string;
}) {
  // Create KYC record
  const kyc = await prisma.kycRecord.create({
    data: {
      userId: data.userId,
      orgId: data.orgId,
      status: 'pending',
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: new Date(data.dateOfBirth),
      address: data.address,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
    },
  });

  // In production, integrate with Sardine or Persona
  // For now, we'll implement simple scoring
  const score = await calculateSardineScore(data);

  await prisma.kycRecord.update({
    where: { id: kyc.id },
    data: {
      score: score.total,
      riskLevel: score.riskLevel,
      status: score.riskLevel === 'high' ? 'review' : 'approved',
      completedAt: new Date(),
    },
  });

  return { kycId: kyc.id, score: score.total, riskLevel: score.riskLevel };
}

async function calculateSardineScore(data: any) {
  let score = 100;

  // Age calculation
  const birthDate = new Date(data.dateOfBirth);
  const age = (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (age < 18 || age > 100) score -= 30;

  // Address validation (simplified)
  if (!data.address || data.address.length < 5) score -= 20;

  // Postal code validation
  if (!data.postalCode || data.postalCode.length !== 5) score -= 20;

  const riskLevel = score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high';

  return { total: Math.max(0, score), riskLevel };
}

async function getKYCStatus(userId: string) {
  const kyc = await prisma.kycRecord.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return kyc || null;
}

// ============================================================================
// MIDDLEWARE - Require KYC
// ============================================================================

export async function requireKYC(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  const userId = auth.user.sub;
  const kyc = await getKYCStatus(userId);

  if (!kyc || kyc.status !== 'approved') {
    return NextResponse.json(
      {
        data: null,
        error: 'KYC verification required',
        code: 'KYC_REQUIRED',
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  return { user: auth.user, kyc };
}

export { initiateKYC, getKYCStatus };