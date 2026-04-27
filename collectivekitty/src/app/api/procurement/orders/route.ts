import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, createEvent, successResponse, errorResponse } from '@/lib/authMiddleware';

export const dynamic = 'force-dynamic';

/**
 * PURCHASE ORDERS - Sprint 2 Item #9
 * POST /api/procurement/orders - PR → PO conversion
 */

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const body = await request.json();
    const { requisitionId, vendorId, notes } = body;
    
    if (!requisitionId || !vendorId) {
      return errorResponse('Missing required fields: requisitionId, vendorId', 400);
    }
    
    // Get requisition
    const req = await prisma.purchaseRequisition.findUnique({
      where: { id: requisitionId },
      include: { items: true }
    });
    
    if (!req) {
      return errorResponse('Requisition not found', 404);
    }
    
    if (req.status !== 'approved') {
      return errorResponse('Requisition must be approved before creating PO', 400);
    }
    
    // Convert to PO
    const order = await prisma.purchaseOrder.create({
      data: {
        requisitionId: req.id,
        vendorId,
        title: req.title,
        totalAmount: req.totalAmount,
        status: 'pending',
        notes,
        createdById: auth.user.sub
      },
      include: { vendor: true }
    });
    
    // Update requisition status
    await prisma.purchaseRequisition.update({
      where: { id: requisitionId },
      data: { status: 'ordered' }
    });
    
    await createEvent('PO_CREATED', {
      orderId: order.id,
      requisitionId: req.id,
      vendorId
    });
    
    return successResponse(order);
  } catch (error) {
    return errorResponse('Failed to create purchase order: ' + error.message);
  }
}

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');
    
    const where: any = {};
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    
    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: { vendor: true, requisition: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return successResponse(orders);
  } catch (error) {
    return errorResponse('Failed to fetch orders: ' + error.message);
  }
}