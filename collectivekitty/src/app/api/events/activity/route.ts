import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * ACTIVITY FEED - Dashboard polling endpoint
 * Returns unified activity from all sources
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Fetch from multiple sources
    const [
      invoices,
      transactions,
      events,
      approvals,
      cards
    ] = await Promise.all([
      // Recent invoices
      prisma.vendorInvoice.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { vendor: true }
      }),
      
      // Bank transactions
      prisma.bankTransaction.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { bankLink: true }
      }),

      // System events
      prisma.event.findMany({
        where: { timestamp: { gte: since } },
        orderBy: { timestamp: 'desc' },
        take: limit
      }),

      // Pending approvals
      prisma.purchaseRequisition.findMany({
        where: { 
          status: { in: ['pending', 'pending_director'] },
          createdAt: { gte: since }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { requester: true }
      }),

      // Card transactions
      prisma.cardTransaction.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { card: true }
      })
    ]);

    // Unify into activity feed
    const activities: any[] = [];

    for (const inv of invoices) {
      activities.push({
        id: `inv-${inv.id}`,
        type: 'INVOICE',
        subtype: inv.status,
        title: `Invoice ${inv.invoiceNumber}`,
        description: `$${inv.amount} from ${inv.vendor?.name || 'Unknown'}`,
        amount: inv.amount,
        status: inv.status,
        timestamp: inv.createdAt,
        link: `/finance/invoices/${inv.id}`
      });
    }

    for (const txn of transactions) {
      activities.push({
        id: `txn-${txn.id}`,
        type: 'TRANSACTION',
        subtype: txn.pending ? 'PENDING' : 'COMPLETED',
        title: txn.merchantName || txn.name,
        description: `${txn.amount > 0 ? 'Payment received' : 'Payment sent'}: $${Math.abs(txn.amount)}`,
        amount: txn.amount,
        status: txn.pending ? 'pending' : 'completed',
        timestamp: txn.createdAt,
        link: `/banking/transactions/${txn.id}`
      });
    }

    for (const evt of events) {
      activities.push({
        id: `evt-${evt.id}`,
        type: 'SYSTEM',
        subtype: evt.type,
        title: evt.type.replace(/_/g, ' '),
        description: typeof evt.payload === 'string' ? evt.payload : JSON.stringify(evt.payload || {}),
        timestamp: evt.timestamp,
        link: null
      });
    }

    for (const appr of approvals) {
      activities.push({
        id: `appr-${appr.id}`,
        type: 'APPROVAL',
        subtype: appr.status,
        title: `Approval: ${appr.title}`,
        description: `$${appr.totalAmount} requested by ${appr.requester?.name || 'Unknown'}`,
        amount: appr.totalAmount,
        status: appr.status,
        timestamp: appr.createdAt,
        link: `/procurement/requisitions/${appr.id}`
      });
    }

    for (const card of cards) {
      activities.push({
        id: `card-${card.id}`,
        type: 'CARD_SPEND',
        subtype: card.status,
        title: `Card Spend: ${card.merchant}`,
        description: `$${card.amount}`,
        amount: card.amount,
        status: card.status,
        timestamp: card.createdAt,
        link: `/spend/cards/${card.cardId}`
      });
    }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return with summary stats
    const stats = {
      totalTransactions: transactions.filter(t => !t.pending).length,
      pendingApprovals: approvals.length,
      totalSpend: cards.reduce((sum, c) => sum + (c.amount || 0), 0),
      invoiceCount: invoices.length,
      activeCards: cards.filter(c => c.status === 'pending').length
    };

    return NextResponse.json({
      data: {
        activities: activities.slice(0, limit),
        stats,
        period: { hours, since: since.toISOString() }
      },
      error: null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ACTIVITY_FEED] Error:', error);
    return NextResponse.json({
      data: null,
      error: 'Failed to fetch activity: ' + error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}