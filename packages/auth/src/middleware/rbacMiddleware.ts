/**
 * Role-Based Access Control (RBAC) Middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Permission, UserRole } from '../types';
import { hasPermission } from '../types';
import { getUserFromRequest } from './authMiddleware';

export interface RBACMiddlewareOptions {
  /**
   * Required permission
   */
  permission: Permission;
  /**
   * Custom forbidden response
   */
  forbiddenResponse?: () => NextResponse;
}

/**
 * Create RBAC middleware
 */
export function createRBACMiddleware(options: RBACMiddlewareOptions) {
  return async function rbacMiddleware(request: NextRequest): Promise<NextResponse | null> {
    // Get user from request
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 }
      );
    }

    // Check permission
    if (!hasPermission(user.role as UserRole, options.permission)) {
      return options.forbiddenResponse?.() || NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    return null; // Continue to next middleware/handler
  };
}

/**
 * Check if user has permission (helper function)
 */
export function checkPermission(
  role: UserRole,
  permission: Permission
): boolean {
  return hasPermission(role, permission);
}
