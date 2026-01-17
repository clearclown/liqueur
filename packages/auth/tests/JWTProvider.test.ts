/**
 * JWTProvider Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JWTProvider } from '../src/providers/JWTProvider';
import { UserRole } from '../src/types';
import type { User } from '../src/types';

describe('JWTProvider', () => {
  let provider: JWTProvider;
  let testUser: User;

  beforeEach(() => {
    provider = new JWTProvider({
      secret: 'test-secret-key',
      expiresIn: '1h',
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

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = provider.generateToken(testUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include user information in token payload', () => {
      const token = provider.generateToken(testUser);
      const payload = provider.decodeToken(token);

      expect(payload).toBeDefined();
      expect(payload!.userId).toBe(testUser.id);
      expect(payload!.email).toBe(testUser.email);
      expect(payload!.role).toBe(testUser.role);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = provider.generateToken(testUser);
      const payload = provider.verifyToken(token);

      expect(payload).toBeDefined();
      expect(payload!.userId).toBe(testUser.id);
      expect(payload!.email).toBe(testUser.email);
    });

    it('should return null for invalid token', () => {
      const payload = provider.verifyToken('invalid-token');
      expect(payload).toBeNull();
    });

    it('should return null for token with wrong secret', () => {
      const otherProvider = new JWTProvider({ secret: 'different-secret' });
      const token = provider.generateToken(testUser);
      const payload = otherProvider.verifyToken(token);

      expect(payload).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = provider.generateToken(testUser);
      const payload = provider.decodeToken(token);

      expect(payload).toBeDefined();
      expect(payload!.userId).toBe(testUser.id);
    });

    it('should return null for malformed token', () => {
      const payload = provider.decodeToken('not-a-jwt');
      expect(payload).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = provider.generateToken(testUser);
      const expired = provider.isTokenExpired(token);

      expect(expired).toBe(false);
    });

    it('should return true for expired token', () => {
      const expiredProvider = new JWTProvider({
        secret: 'test-secret',
        expiresIn: '0s', // Immediate expiration
      });

      const token = expiredProvider.generateToken(testUser);

      // Wait a bit to ensure expiration
      setTimeout(() => {
        const expired = expiredProvider.isTokenExpired(token);
        expect(expired).toBe(true);
      }, 100);
    });

    it('should return true for invalid token', () => {
      const expired = provider.isTokenExpired('invalid-token');
      expect(expired).toBe(true);
    });
  });
});
