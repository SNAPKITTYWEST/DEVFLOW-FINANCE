import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, createEvent, successResponse, errorResponse } from '@/lib/authMiddleware';

/**
 * REQUISITION APPROVAL - Sprint 2 Item #8
 * PATCH /api/procurement/requisitions/:id/approve → approval logic
 */

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const body = await request.json();
    const { action, approverNotes } = body;
    
    const requisition = await prisma.purchaseRequisition.findUnique({
      where: { id: params.id }
    });
    
    if (!requisition) {
      return errorResponse('Requisition not found', 404);
    }
    
    // Approval logic
    let newStatus = requisition.status;
    let approved = false;
    
    if (action === 'approve') {
      // Manager approval - threshold based
      if (requisition.totalAmount <= 10000) {
        newStatus = 'approved';
        approved = true;
      } else {
        newStatus = 'pending_director'; // Needs director
      }
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'approve_director') {
      newStatus = 'approved';
      approved = true;
    }
    
    const updated = await prisma.purchaseRequisition.update({
      where: { id: params.id },
      data: { 
        status: newStatus,
        approverNotes,
        approvedAt: approved ? new Date() : null,
        approverId: approved ? auth.user.sub : null
      }
    });
    
    await createEvent(`REQUISITION_${action.toUpperCase()}`, {
      requisitionId: requisition.id,
      newStatus,
      approver: auth.user.email
    });
    
    return successResponse(updated);
  } catch (error) {
    return errorResponse('Failed to process approval: ' + error.message);
  }
}