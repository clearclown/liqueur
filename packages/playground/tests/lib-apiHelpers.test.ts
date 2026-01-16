/**
 * API Helpers Tests
 * lib/apiHelpers.ts のユニットテスト
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  validateString,
  checkRateLimit,
  getRateLimitInfo,
  createErrorResponse,
} from "../lib/apiHelpers";

describe("API Helpers", () => {
  describe("validateString", () => {
    it("should accept valid strings", () => {
      const result = validateString("valid string", "testField");
      expect(result.valid).toBe(true);
    });

    it("should reject non-string values", () => {
      const result = validateString(123, "testField");
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.response.status).toBe(400);
        const json = result.response.json() as any;
        expect(json).resolves.toMatchObject({
          error: { code: "INVALID_TYPE" },
        });
      }
    });

    it("should enforce minimum length", () => {
      const result = validateString("ab", "testField", { minLength: 3 });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        const json = result.response.json() as any;
        expect(json).resolves.toMatchObject({
          error: { code: "INVALID_LENGTH" },
        });
      }
    });

    it("should enforce maximum length", () => {
      const result = validateString("very long string", "testField", { maxLength: 5 });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        const json = result.response.json() as any;
        expect(json).resolves.toMatchObject({
          error: { code: "INVALID_LENGTH" },
        });
      }
    });

    it("should trim whitespace before validation", () => {
      const result = validateString("  abc  ", "testField", { minLength: 3 });
      expect(result.valid).toBe(true);
    });

    it("should accept strings within length range", () => {
      const result = validateString("hello", "testField", {
        minLength: 3,
        maxLength: 10,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("Rate Limiting", () => {
    beforeEach(() => {
      // Note: In real tests, we'd need to reset the internal rate limit store
      // For now, we use unique identifiers per test
    });

    it("should allow requests within limit", () => {
      const identifier = `test-${Date.now()}-1`;
      const allowed = checkRateLimit(identifier, 5, 60000);
      expect(allowed).toBe(true);
    });

    it("should block requests exceeding limit", () => {
      const identifier = `test-${Date.now()}-2`;
      const maxRequests = 3;

      // Make max requests
      for (let i = 0; i < maxRequests; i++) {
        const allowed = checkRateLimit(identifier, maxRequests, 60000);
        expect(allowed).toBe(true);
      }

      // Next request should be blocked
      const blocked = checkRateLimit(identifier, maxRequests, 60000);
      expect(blocked).toBe(false);
    });

    it("should reset after window expires", async () => {
      const identifier = `test-${Date.now()}-3`;
      const maxRequests = 2;
      const windowMs = 100; // 100ms window

      // Use up limit
      checkRateLimit(identifier, maxRequests, windowMs);
      checkRateLimit(identifier, maxRequests, windowMs);

      // Should be blocked
      expect(checkRateLimit(identifier, maxRequests, windowMs)).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, windowMs + 10));

      // Should be allowed again
      expect(checkRateLimit(identifier, maxRequests, windowMs)).toBe(true);
    });

    it("should track different identifiers separately", () => {
      const id1 = `test-${Date.now()}-4a`;
      const id2 = `test-${Date.now()}-4b`;
      const maxRequests = 2;

      // Use up id1 limit
      checkRateLimit(id1, maxRequests, 60000);
      checkRateLimit(id1, maxRequests, 60000);
      expect(checkRateLimit(id1, maxRequests, 60000)).toBe(false);

      // id2 should still be allowed
      expect(checkRateLimit(id2, maxRequests, 60000)).toBe(true);
    });
  });

  describe("getRateLimitInfo", () => {
    it("should return null for unknown identifier", () => {
      const info = getRateLimitInfo("unknown-identifier");
      expect(info).toBeNull();
    });

    it("should return rate limit info after request", () => {
      const identifier = `test-${Date.now()}-5`;
      checkRateLimit(identifier, 10, 60000);

      const info = getRateLimitInfo(identifier);
      expect(info).not.toBeNull();
      if (info) {
        expect(info.remaining).toBeGreaterThanOrEqual(0);
        expect(info.resetAt).toBeGreaterThan(Date.now());
      }
    });

    it("should decrement remaining count", () => {
      const identifier = `test-${Date.now()}-6`;
      const maxRequests = 5;

      checkRateLimit(identifier, maxRequests, 60000);
      const info1 = getRateLimitInfo(identifier);

      checkRateLimit(identifier, maxRequests, 60000);
      const info2 = getRateLimitInfo(identifier);

      if (info1 && info2) {
        expect(info2.remaining).toBe(info1.remaining - 1);
      }
    });
  });

  describe("createErrorResponse", () => {
    it("should create error response with correct structure", async () => {
      const response = createErrorResponse("TEST_ERROR", "Test error message", 400);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toMatchObject({
        error: {
          code: "TEST_ERROR",
          message: "Test error message",
        },
      });
    });

    it("should include details when provided", async () => {
      const response = createErrorResponse(
        "TEST_ERROR",
        "Test error",
        500,
        "Additional details"
      );

      const json = await response.json();
      expect(json).toMatchObject({
        error: {
          code: "TEST_ERROR",
          message: "Test error",
          details: "Additional details",
        },
      });
    });

    it("should omit details when not provided", async () => {
      const response = createErrorResponse("TEST_ERROR", "Test error", 400);

      const json = await response.json();
      expect(json.error).not.toHaveProperty("details");
    });

    it("should support various status codes", async () => {
      const codes = [400, 401, 403, 404, 429, 500, 503];

      for (const code of codes) {
        const response = createErrorResponse("TEST_ERROR", "Test", code);
        expect(response.status).toBe(code);
      }
    });
  });
});
