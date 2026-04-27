import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, createEvent, successResponse, errorResponse } from '@/lib/authMiddleware';

export const dynamic = 'force-dynamic';

/**
 * CRM OPPORTUNITIES - Sprint 1
 * GET /api/crm/opportunities → list with stage filter
 * POST /api/crm/opportunities → insert to DB, return record
 * PATCH /api/crm/opportunities/:id → update stage
 */

export async function GET(request: NextRequest) {
  // 1. Auth check
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const ownerId = searchParams.get('ownerId');
    
    const where: any = {};
    if (stage) where.stage = stage;
    if (ownerId) where.ownerId = ownerId;
    
    const opportunities = await prisma.opportunity.findMany({
      where,
      include: { company: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return successResponse(opportunities);
  } catch (error) {
    return errorResponse('Failed to fetch opportunities: ' + error.message);
  }
}

export async function POST(request: NextRequest) {
  // 1. Auth check
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.value) {
      return errorResponse('Missing required fields: name, value', 400);
    }
    
    // Create opportunity
    const opportunity = await prisma.opportunity.create({
      data: {
        name: body.name,
        value: body.value,
        stage: body.stage || 'prospecting',
        companyId: body.companyId,
        ownerId: auth.user.sub
      }
    });
    
    // Log event (every write: createEvent after DB insert)
    await createEvent('OPPORTUNITY_CREATED', {
      opportunityId: opportunity.id,
      name: opportunity.name,
      value: opportunity.value
    });
    
    return successResponse(opportunity);
  } catch (error) {
    return errorResponse('Failed to create opportunity: ' + error.message);
  }
}