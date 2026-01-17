/**
 * Session Authentication Provider
 */

import { randomBytes } from 'crypto';
import type { SessionData, User } from '../types';

export interface SessionOptions {
  /**
   * Session duration in milliseconds
   */
  maxAge?: number;
  /**
   * Session cookie name
   */
  cookieName?: string;
}

export class SessionProvider {
  private sessions: Map<string, SessionData>;
  private options: Required<SessionOptions>;

  constructor(options: SessionOptions = {}) {
    this.sessions = new Map();
    this.options = {
      maxAge: options.maxAge || 24 * 60 * 60 * 1000, // 24 hours
      cookieName: options.cookieName || 'liquid_session',
    };
  }

  /**
   * Create new session
   */
  createSession(user: User): string {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + this.options.maxAge);

    this.sessions.set(sessionId, {
      userId: user.id,
      user,
      expiresAt,
    });

    return sessionId;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check expiration
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Refresh session expiration
   */
  refreshSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return false;
    }

    session.expiresAt = new Date(Date.now() + this.options.maxAge);
    this.sessions.set(sessionId, session);

    return true;
  }

  /**
   * Clear all expired sessions
   */
  clearExpiredSessions(): number {
    let count = 0;
    const now = new Date();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
        count++;
      }
    }

    return count;
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get cookie name
   */
  getCookieName(): string {
    return this.options.cookieName;
  }

  /**
   * Generate random session ID
   */
  private generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }
}
