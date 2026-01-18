import { prisma } from './prisma';

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Get current user from request
 * In production, this should verify JWT tokens
 * For demo purposes, we use a simple demo user
 */
export async function getCurrentUser(request: Request): Promise<CurrentUser | null> {
  // Check for Authorization header
  const authHeader = request.headers.get('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    // In production, verify JWT token here
    // For demo, we just use the token as user id
    const token = authHeader.substring(7);

    try {
      const user = await prisma.user.findUnique({
        where: { id: token },
        select: { id: true, email: true, name: true },
      });

      if (user) {
        return user;
      }
    } catch {
      // Token is not a valid user id
    }
  }

  // For demo purposes, return the demo user
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@example.com' },
    select: { id: true, email: true, name: true },
  });

  return demoUser;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(request: Request): Promise<CurrentUser> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
