import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * AUTH MIDDLEWARE - Entra JWT Validation
 * Every route: validate Entra JWT first. No token = 401.
 */

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

export async function authMiddleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { data: null, error: 'Missing or invalid authorization header', timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }
  
  const token = authHeader.slice(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { user: decoded, valid: true };
  } catch (error) {
    return NextResponse.json(
      { data: null, error: 'Invalid or expired token', timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }
}

export async function createEvent(type: string, payload: any) {
  const { prisma } = await import('@/lib/prisma');
  
  return prisma.event.create({
    data: {
      type,
      payload: JSON.stringify(payload),
      timestamp: new Date()
    }
  });
}

export function successResponse(data: any) {
  return NextResponse.json({
    data,
    error: null,
    timestamp: new Date().toISOString()
  });
}

export function errorResponse(message: string, status: number = 500) {
  console.error(`[ERROR] ${message}`);
  return NextResponse.json({
    data: null,
    error: message,
    timestamp: new Date().toISOString()
  }, { status });
}