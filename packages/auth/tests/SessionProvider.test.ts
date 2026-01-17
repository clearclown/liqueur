/**
 * SessionProvider Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SessionProvider } from '../src/providers/SessionProvider';
import { UserRole } from '../src/types';
import type { User } from '../src/types';

describe('SessionProvider', () => {
  let provider: SessionProvider;
  let testUser: User;

  beforeEach(() => {
    provider = new SessionProvider({
      maxAge: 1000 * 60 * 60, // 1 hour
      cookieName: 'test_session',
    });

    testUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.EDITOR,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const sessionId = provider.createSession(testUser);

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should generate unique session IDs', () => {
      const sessionId1 = provider.createSession(testUser);
      const sessionId2 = provider.createSession(testUser);

      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('getSession', () => {
    it('should retrieve session by ID', () => {
      const sessionId = provider.createSession(testUser);
      const session = provider.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session!.userId).toBe(testUser.id);
      expect(session!.user).toEqual(testUser);
    });

    it('should return null for non-existent session', () => {
      const session = provider.getSession('non-existent-id');
      expect(session).toBeNull();
    });

    it('should return null for expired session', async () => {
      const shortProvider = new SessionProvider({ maxAge: 50 }); // 50ms
      const sessionId = shortProvider.createSession(testUser);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const session = shortProvider.getSession(sessionId);
      expect(session).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session', () => {
      const sessionId = provider.createSession(testUser);
      const deleted = provider.deleteSession(sessionId);

      expect(deleted).toBe(true);

      const session = provider.getSession(sessionId);
      expect(session).toBeNull();
    });

    it('should return false for non-existent session', () => {
      const deleted = provider.deleteSession('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('refreshSession', () => {
    it('should refresh session expiration', () => {
      const sessionId = provider.createSession(testUser);
      const originalSession = provider.getSession(sessionId);
      const originalExpiry = originalSession!.expiresAt;

      // Wait a bit
      setTimeout(() => {
        const refreshed = provider.refreshSession(sessionId);
        expect(refreshed).toBe(true);

        const newSession = provider.getSession(sessionId);
        expect(newSession!.expiresAt.getTime()).toBeGreaterThan(originalExpiry.getTime());
      }, 10);
    });

    it('should return false for non-existent session', () => {
      const refreshed = provider.refreshSession('non-existent-id');
      expect(refreshed).toBe(false);
    });
  });

  describe('clearExpiredSessions', () => {
    it('should clear all expired sessions', async () => {
      const shortProvider = new SessionProvider({ maxAge: 50 });

      // Create multiple sessions
      shortProvider.createSession(testUser);
      shortProvider.createSession(testUser);
      shortProvider.createSession(testUser);

      expect(shortProvider.getSessionCount()).toBe(3);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const cleared = shortProvider.clearExpiredSessions();
      expect(cleared).toBe(3);
      expect(shortProvider.getSessionCount()).toBe(0);
    });

    it('should not clear valid sessions', () => {
      provider.createSession(testUser);
      provider.createSession(testUser);

      const cleared = provider.clearExpiredSessions();
      expect(cleared).toBe(0);
      expect(provider.getSessionCount()).toBe(2);
    });
  });

  describe('getSessionCount', () => {
    it('should return correct session count', () => {
      expect(provider.getSessionCount()).toBe(0);

      provider.createSession(testUser);
      expect(provider.getSessionCount()).toBe(1);

      provider.createSession(testUser);
      expect(provider.getSessionCount()).toBe(2);
    });
  });

  describe('getCookieName', () => {
    it('should return configured cookie name', () => {
      expect(provider.getCookieName()).toBe('test_session');
    });

    it('should return default cookie name', () => {
      const defaultProvider = new SessionProvider();
      expect(defaultProvider.getCookieName()).toBe('liquid_session');
    });
  });
});
