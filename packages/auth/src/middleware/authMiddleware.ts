/**
 * Authentication Middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import type { User } from '../types';

export interface AuthMiddlewareOptions {
  /**
   * Function to verify token and get user
   */
  verifyToken: (token: string) => Promise<User | null> | User | null;
  /**
   * Paths to exclude from authentication
   */
  publicPaths?: string[];
  /**
   * Custom unauthorized response
   */
  unauthorizedResponse?: () => NextResponse;
}

/**
 * Create authentication middleware
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions) {
  return async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
    const { pathname } = request.nextUrl;

    // Check if path is public
    if (options.publicPaths?.some(path => pathname.startsWith(path))) {
      return null; // Continue to next middleware/handler
    }

    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return options.unauthorizedResponse?.() || NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const user = await options.verifyToken(token);

    if (!user) {
      return options.unauthorizedResponse?.() || NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Attach user to request headers (Next.js doesn't allow direct request mutation)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-User-Id', user.id);
    requestHeaders.set('X-User-Email', user.email);
    requestHeaders.set('X-User-Role', user.role);

    return null; // Continue to next middleware/handler
  };
}

/**
 * Extract user from request headers
 */
export function getUserFromRequest(request: NextRequest): User | null {
  const userId = request.headers.get('X-User-Id');
  const email = request.headers.get('X-User-Email');
  const role = request.headers.get('X-User-Role');

  if (!userId || !email || !role) {
    return null;
  }

  return {
    id: userId,
    email,
    role: role as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
