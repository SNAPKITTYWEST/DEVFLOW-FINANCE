import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, createEvent, successResponse, errorResponse } from '@/lib/authMiddleware';

export const dynamic = 'force-dynamic';

/**
 * PROCUREMENT REQUISITIONS - Sprint 2
 * GET /api/procurement/requisitions → list
 * POST /api/procurement/requisitions → create PR
 */

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const where: any = {};
    if (status) where.status = status;
    
    const requisitions = await prisma.purchaseRequisition.findMany({
      where,
      include: { items: true, requester: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return successResponse(requisitions);
  } catch (error) {
    return errorResponse('Failed to fetch requisitions: ' + error.message);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const body = await request.json();
    
    if (!body.items || body.items.length === 0) {
      return errorResponse('Requisition must have at least one item', 400);
    }
    
    // Create requisition with items
    const requisition = await prisma.purchaseRequisition.create({
      data: {
        title: body.title,
        description: body.description,
        totalAmount: body.totalAmount,
        status: 'pending',
        requesterId: auth.user.sub,
        items: {
          create: body.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            category: item.category
          }))
        }
      },
      include: { items: true }
    });
    
    await createEvent('REQUISITION_CREATED', {
      requisitionId: requisition.id,
      title: requisition.title,
      totalAmount: requisition.totalAmount
    });
    
    return successResponse(requisition);
  } catch (error) {
    return errorResponse('Failed to create requisition: ' + error.message);
  }
}