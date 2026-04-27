import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSovereignContext } from '@/lib/auth-guard';

/**
 * CRM OPPORTUNITY HANDLER
 * The deterministic write path for the $1.7B pipeline.
 */

export async function GET() {
  try {
    const ctx = await getSovereignContext();
    const opps = await prisma.opportunity.findMany({
      where: { ownerId: ctx.azureOid },
      include: { company: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(opps);
  } catch (error) {
    console.error("GET_OPPS_ERROR:", error);
    return NextResponse.json({ error: "UNAUTHORIZED_OR_DB_FAIL" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getSovereignContext();
    const body = await request.json();

    // Ensure organization exists or get it from context
    // For MVP, we assume orgId is provided or we find the user's primary org
    const user = await prisma.user.findUnique({
      where: { azureOid: ctx.azureOid }
    });

    if (!user) {
        return NextResponse.json({ error: "USER_NOT_PROVISIONED" }, { status: 403 });
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        name: body.name,
        value: parseFloat(body.value),
        currency: body.currency || "USD",
        stage: body.stage || 'prospecting',
        companyId: body.companyId,
        ownerId: user.id,
      }
    });

    // LOG EVENT TO IMMUTABLE LEDGER
    await prisma.event.create({
      data: {
        type: 'CRM_SYNC',
        payload: { action: 'OPPORTUNITY_CREATED', oppId: opportunity.oppId },
        userId: user.id,
        oppId: opportunity.oppId
      }
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("POST_OPP_ERROR:", error);
    return NextResponse.json({ error: "WRITE_FAILED" }, { status: 500 });
  }
}
