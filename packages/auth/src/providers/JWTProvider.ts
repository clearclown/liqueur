/**
 * JWT Authentication Provider
 */

import jwt from 'jsonwebtoken';
import type { JWTPayload, User, AuthResult } from '../types';

export interface JWTOptions {
  secret: string;
  expiresIn?: string | number;
  algorithm?: jwt.Algorithm;
}

export class JWTProvider {
  private options: Required<JWTOptions>;

  constructor(options: JWTOptions) {
    this.options = {
      secret: options.secret,
      expiresIn: options.expiresIn || '24h',
      algorithm: options.algorithm || 'HS256',
    };
  }

  /**
   * Generate JWT token
   */
  generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, this.options.secret, {
      expiresIn: this.options.expiresIn,
      algorithm: this.options.algorithm,
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, this.options.secret, {
        algorithms: [this.options.algorithm],
      }) as JWTPayload;

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    return decoded.exp * 1000 < Date.now();
  }
}
