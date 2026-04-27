import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, successResponse, errorResponse } from '@/lib/authMiddleware';

/**
 * EVENTS QUERY API
 * GET /api/events - List events with filters
 * GET /api/events/activity - Activity feed for dashboard
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (type) where.type = type;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.event.count({ where })
    ]);

    // Get event counts by type
    const typeCounts = await prisma.event.groupBy({
      by: ['type'],
      _count: true,
      orderBy: { _count: { type: 'desc' } },
      take: 10
    });

    return successResponse({
      events,
      pagination: { total, limit, offset, hasMore: offset + events.length < total },
      typeCounts: typeCounts.map(t => ({ type: t.type, count: t._count }))
    });
  } catch (error) {
    return errorResponse('Failed to fetch events: ' + error.message);
  }
}