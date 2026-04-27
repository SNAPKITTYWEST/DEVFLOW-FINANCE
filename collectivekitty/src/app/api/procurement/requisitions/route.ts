import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSovereignContext } from '@/lib/auth-guard';

/**
 * PROCUREMENT REQUISITION HANDLER
 * Implements Sovereign Approval Hierarchy.
 */

export async function POST(request: Request) {
  try {
    const ctx = await getSovereignContext();
    const body = await request.json();
    const cost = parseFloat(body.estimatedCost);

    // DETERMINISTIC APPROVAL LOGIC
    let status = 'submitted';
    let approvalNeededBy = 'manager'; // Default

    if (cost < 1000) {
      status = 'approved'; // Auto-approved
      approvalNeededBy = 'system';
    } else if (cost > 10000) {
      approvalNeededBy = 'finance_director';
    }

    const pr = await prisma.purchaseRequisition.create({
      data: {
        orgId: body.orgId,
        requestedById: ctx.azureOid,
        projectId: body.projectId,
        title: body.title,
        description: body.description,
        estimatedCost: cost,
        status: status,
        priority: body.priority || 'normal'
      }
    });

    // LOG TO IMMUTABLE AUDIT TRAIL
    await prisma.event.create({
      data: {
        type: 'FINANCIAL',
        payload: { action: 'PR_CREATED', prId: pr.id, status: status }
      }
    });

    return NextResponse.json(pr);
  } catch (error) {
    return NextResponse.json({ error: "PROCUREMENT_WRITE_FAILED" }, { status: 500 });
  }
}
