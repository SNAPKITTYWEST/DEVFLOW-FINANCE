import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, successResponse, errorResponse } from '@/lib/authMiddleware';
import { runReconciliation, getExceptions } from '@/lib/reconciliationService';

/**
 * RECONCILIATION RUN - Sprint 5 #24
 * POST /api/fintech/reconciliation/run
 */

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const orgId = auth.user.orgId || 'default';

    const result = await runReconciliation(orgId);

    return successResponse(result);
  } catch (error) {
    return errorResponse('Failed to run reconciliation: ' + error.message);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('runId');

  if (runId) {
    const exceptions = await getExceptions(runId);
    if (!exceptions) {
      return errorResponse('Run not found', 404);
    }
    return successResponse(exceptions);
  }

  // List all runs
  const runs = await prisma.reconciliationRun.findMany({
    orderBy: { completedAt: 'desc' },
    take: 20,
  });

  return successResponse(runs);
}