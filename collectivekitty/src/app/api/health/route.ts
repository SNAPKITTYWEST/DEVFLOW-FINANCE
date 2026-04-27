import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: "ok",
      db: "connected",
      version: "2.2.0",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      db: "disconnected",
      version: "2.2.0",
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 503 });
  }
}