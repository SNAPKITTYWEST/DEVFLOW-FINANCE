import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, createEvent, successResponse, errorResponse } from '@/lib/authMiddleware';

export const dynamic = 'force-dynamic';

/**
 * VENDOR INVOICES - Sprint 4
 * POST /api/finance/vendor-invoices → create + trigger match
 */

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
    
    const invoices = await prisma.vendorInvoice.findMany({
      where,
      include: { vendor: true, po: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return successResponse(invoices);
  } catch (error) {
    return errorResponse('Failed to fetch invoices: ' + error.message);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const body = await request.json();
    
    // Validate
    if (!body.vendorId || !body.amount) {
      return errorResponse('Missing required fields: vendorId, amount', 400);
    }
    
    // Create invoice
    const invoice = await prisma.vendorInvoice.create({
      data: {
        vendorId: body.vendorId,
        poId: body.poId,
        invoiceNumber: body.invoiceNumber,
        invoiceDate: new Date(body.invoiceDate),
        dueDate: new Date(body.dueDate),
        amount: body.amount,
        status: 'pending',
        orgId: auth.user.orgId || 'default'
      }
    });
    
    // Trigger 3-way match if PO exists
    if (body.poId) {
      const matchResult = await threeWayMatch(body.poId, invoice.id);
      await prisma.vendorInvoice.update({
        where: { id: invoice.id },
        data: { matchStatus: matchResult.status }
      });
    }
    
    await createEvent('VENDOR_INVOICE_CREATED', {
      invoiceId: invoice.id,
      vendorId: body.vendorId,
      amount: body.amount
    });
    
    return successResponse(invoice);
  } catch (error) {
    return errorResponse('Failed to create invoice: ' + error.message);
  }
}

/**
 * THREE-WAY MATCH - Sprint 4 Item #16
 */
async function threeWayMatch(poId: string, invoiceId: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId }
  });
  
  const invoice = await prisma.vendorInvoice.findUnique({
    where: { id: invoiceId }
  });
  
  if (!po || !invoice) {
    return { status: 'error', message: 'PO or Invoice not found' };
  }
  
  // Simplified: amount match
  const poAmount = Number(po.totalAmount);
  const invoiceAmount = invoice.amount;
  
  const priceMatch = Math.abs(poAmount - invoiceAmount) < 0.01;
  const status = priceMatch ? 'matched' : 'price_mismatch';
  
  return { 
    status,
    message: priceMatch ? 'Matched' : 'Price mismatch - review required'
  };
}