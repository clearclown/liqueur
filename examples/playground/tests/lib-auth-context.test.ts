/**
 * User Context Utilities Tests
 * lib/auth/context.ts のユニットテスト
 *
 * TDD Approach: Red-Green-Refactor
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { getCurrentUser, hasAccess } from "../lib/auth/context";

describe("User Context Utilities", () => {
  describe("getCurrentUser", () => {
    it("should return user ID from X-User-ID header", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          "X-User-ID": "user-123",
        },
      });

      const userId = getCurrentUser(request);
      expect(userId).toBe("user-123");
    });

    it("should return test-user as fallback in non-production", () => {
      const request = new NextRequest("http://localhost:3000/api/test");

      const userId = getCurrentUser(request);
      expect(userId).toBe("test-user");
    });

    it("should handle empty X-User-ID header", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          "X-User-ID": "",
        },
      });

      // Empty string is falsy, should fallback to test-user
      const userId = getCurrentUser(request);
      expect(userId).toBe("test-user");
    });

    it("should throw error in production without authentication", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const request = new NextRequest("http://localhost:3000/api/test");

      expect(() => getCurrentUser(request)).toThrow(
        "Unauthorized: User authentication required"
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should work with X-User-ID in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          "X-User-ID": "prod-user-456",
        },
      });

      const userId = getCurrentUser(request);
      expect(userId).toBe("prod-user-456");

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("hasAccess", () => {
    it("should return true when user ID matches resource owner ID", () => {
      const result = hasAccess("user-123", "user-123");
      expect(result).toBe(true);
    });

    it("should return false when user ID does not match resource owner ID", () => {
      const result = hasAccess("user-123", "user-456");
      expect(result).toBe(false);
    });

    it("should handle different user ID formats", () => {
      expect(hasAccess("test-user", "test-user")).toBe(true);
      expect(hasAccess("admin", "user")).toBe(false);
      expect(hasAccess("", "")).toBe(true);
    });
  });
});
