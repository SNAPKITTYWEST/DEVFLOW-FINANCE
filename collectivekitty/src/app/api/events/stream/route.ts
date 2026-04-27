import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * EVENTS STREAM - Real-time SSE
 * Wires backend events to frontend via Server-Sent Events
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const url = new URL(request.url);
  const lastEventId = url.searchParams.get('after');
  
  // Get events after timestamp (lastEventId is a timestamp)
  const since = lastEventId ? new Date(parseInt(lastEventId)) : new Date(Date.now() - 3600000); // Last hour default

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const connectMsg = {
        id: Date.now().toString(),
        type: 'connected',
        timestamp: new Date().toISOString(),
        data: { message: 'Bifrost Event Stream Connected' }
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectMsg)}\n\n`));

      // Poll for new events
      let polling = true;
      const pollInterval = setInterval(async () => {
        if (!polling) {
          clearInterval(pollInterval);
          return;
        }

        try {
          // Fetch recent events from database
          const events = await prisma.event.findMany({
            where: {
              timestamp: { gt: since }
            },
            orderBy: { timestamp: 'desc' },
            take: 50,
            distinct: ['type']
          });

          // Also check for unprocessed webhooks/data
          const recentInvoices = await prisma.vendorInvoice.findMany({
            where: {
              createdAt: { gt: since }
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { vendor: true }
          });

          const recentTransactions = await prisma.bankTransaction.findMany({
            where: {
              createdAt: { gt: since }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          });

          // Send transaction events
          for (const txn of recentTransactions) {
            const msg = {
              id: txn.id,
              type: txn.pending ? 'TRANSACTION_PENDING' : 'TRANSACTION_COMPLETE',
              timestamp: txn.createdAt.toISOString(),
              data: {
                amount: txn.amount,
                merchant: txn.merchantName || txn.name,
                category: txn.category,
                status: txn.pending ? 'pending' : 'completed'
              }
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
          }

          // Send invoice events
          for (const inv of recentInvoices) {
            const msg = {
              id: inv.id,
              type: 'INVOICE_CREATED',
              timestamp: inv.createdAt.toISOString(),
              data: {
                invoiceNumber: inv.invoiceNumber,
                vendor: inv.vendor?.name,
                amount: inv.amount,
                status: inv.status
              }
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
          }

          // Send generic events
          for (const evt of events) {
            const msg = {
              id: evt.id,
              type: evt.type,
              timestamp: evt.timestamp.toISOString(),
              data: evt.payload
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
          }

        } catch (error) {
          console.error('[EVENT_STREAM] Poll error:', error);
        }
      }, 2000); // Poll every 2 seconds

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        polling = false;
        clearInterval(pollInterval);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}

/**
 * POST /api/events - Manually trigger an event (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing type' }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        type,
        payload: payload || {},
        timestamp: new Date()
      }
    });

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}