import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, createEvent, successResponse, errorResponse } from '@/lib/authMiddleware';

/**
 * CRM OPPORTUNITY BY ID - Sprint 1 Item #4
 * PATCH /api/crm/opportunities/:id → update stage
 */

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // 1. Auth check
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const body = await request.json();
    const { stage } = body;
    
    if (!stage) {
      return errorResponse('Missing required field: stage', 400);
    }
    
    // Valid stages
    const validStages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    if (!validStages.includes(stage)) {
      return errorResponse(`Invalid stage. Must be: ${validStages.join(', ')}`, 400);
    }
    
    // Update opportunity
    const opportunity = await prisma.opportunity.update({
      where: { id: params.id },
      data: { stage }
    });
    
    // Log event
    await createEvent('OPPORTUNITY_STAGE_UPDATED', {
      opportunityId: opportunity.id,
      oldStage: body.oldStage,
      newStage: stage
    });
    
    return successResponse(opportunity);
  } catch (error) {
    return errorResponse('Failed to update opportunity: ' + error.message);
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
      include: { company: true }
    });
    
    if (!opportunity) {
      return errorResponse('Opportunity not found', 404);
    }
    
    return successResponse(opportunity);
  } catch (error) {
    return errorResponse('Failed to fetch opportunity: ' + error.message);
  }
}