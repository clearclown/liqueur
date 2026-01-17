/**
 * @liqueur/auth
 *
 * Authentication and authorization for Project Liquid
 */

export { JWTProvider } from './providers/JWTProvider';
export { SessionProvider } from './providers/SessionProvider';
export { createAuthMiddleware, getUserFromRequest } from './middleware/authMiddleware';
export { createRBACMiddleware, checkPermission } from './middleware/rbacMiddleware';

export type {
  User,
  UserRole,
  JWTPayload,
  SessionData,
  AuthResult,
  Permission,
} from './types';

export {
  UserRole as UserRoleEnum,
  RolePermissions,
  hasPermission,
} from './types';
