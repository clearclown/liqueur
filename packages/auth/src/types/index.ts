/**
 * Authentication Types
 */

/**
 * User representation
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User roles
 */
export enum UserRole {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  ADMIN = 'admin',
}

/**
 * JWT payload
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Session data
 */
export interface SessionData {
  userId: string;
  user: User;
  expiresAt: Date;
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

/**
 * Permission definition
 */
export interface Permission {
  action: 'create' | 'read' | 'update' | 'delete';
  resource: 'artifact' | 'conversation' | 'user' | 'comment' | 'share';
}

/**
 * Role permissions map
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.VIEWER]: [
    { action: 'read', resource: 'artifact' },
    { action: 'read', resource: 'conversation' },
  ],
  [UserRole.EDITOR]: [
    { action: 'create', resource: 'artifact' },
    { action: 'read', resource: 'artifact' },
    { action: 'update', resource: 'artifact' },
    { action: 'create', resource: 'conversation' },
    { action: 'read', resource: 'conversation' },
    { action: 'update', resource: 'conversation' },
    { action: 'create', resource: 'comment' },
    { action: 'read', resource: 'comment' },
    { action: 'update', resource: 'comment' },
    { action: 'delete', resource: 'comment' },
    { action: 'create', resource: 'share' },
    { action: 'read', resource: 'share' },
    { action: 'delete', resource: 'share' },
  ],
  [UserRole.ADMIN]: [
    { action: 'create', resource: 'artifact' },
    { action: 'read', resource: 'artifact' },
    { action: 'update', resource: 'artifact' },
    { action: 'delete', resource: 'artifact' },
    { action: 'create', resource: 'conversation' },
    { action: 'read', resource: 'conversation' },
    { action: 'update', resource: 'conversation' },
    { action: 'delete', resource: 'conversation' },
    { action: 'create', resource: 'user' },
    { action: 'read', resource: 'user' },
    { action: 'update', resource: 'user' },
    { action: 'delete', resource: 'user' },
    { action: 'create', resource: 'comment' },
    { action: 'read', resource: 'comment' },
    { action: 'update', resource: 'comment' },
    { action: 'delete', resource: 'comment' },
    { action: 'create', resource: 'share' },
    { action: 'read', resource: 'share' },
    { action: 'delete', resource: 'share' },
  ],
};

/**
 * Check if user has permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const rolePerms = RolePermissions[role];
  return rolePerms.some(
    perm => perm.action === permission.action && perm.resource === permission.resource
  );
}
