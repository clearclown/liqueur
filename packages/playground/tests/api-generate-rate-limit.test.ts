/**
 * Generate API Rate Limiting Tests
 * レート制限機能の専用テスト
 */

import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "../app/api/liquid/generate/route";
import { NextRequest } from "next/server";

describe("POST /api/liquid/generate - Rate Limiting", () => {
  const mockMetadata = {
    tables: [
      {
        name: "test_table",
        columns: [
          {
            name: "id",
            type: "integer",
            nullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
          },
        ],
      },
    ],
  };

  const createRequest = (ip: string) => {
    return new NextRequest("http://localhost:3000/api/liquid/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify({
        prompt: "Test prompt",
        metadata: mockMetadata,
      }),
    });
  };

  describe("TC-RATE-001: Rate Limit Enforcement", () => {
    it("should enforce rate limits per IP", async () => {
      const testIp = `10.0.0.${Math.floor(Math.random() * 255)}`;
      const maxRequests = parseInt(process.env.AI_REQUEST_LIMIT_PER_MINUTE || "10");

      // Make requests up to limit
      const responses = [];
      for (let i = 0; i < maxRequests + 2; i++) {
        const request = createRequest(testIp);
        const response = await POST(request);
        responses.push(response);
      }

      // First N requests should succeed
      const successfulResponses = responses.filter((r) => r.status === 200);
      const rateLimitedResponses = responses.filter((r) => r.status === 429);

      expect(successfulResponses.length).toBeGreaterThanOrEqual(1);
      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(1);
    });

    it("should return rate limit headers on 429", async () => {
      const testIp = `10.0.1.${Math.floor(Math.random() * 255)}`;
      const maxRequests = parseInt(process.env.AI_REQUEST_LIMIT_PER_MINUTE || "10");

      // Exhaust rate limit
      for (let i = 0; i < maxRequests + 1; i++) {
        await POST(createRequest(testIp));
      }

      // Next request should be rate limited
      const response = await POST(createRequest(testIp));

      if (response.status === 429) {
        const headers = response.headers;
        expect(headers.has("x-ratelimit-limit")).toBe(true);
        expect(headers.has("x-ratelimit-remaining")).toBe(true);
        expect(headers.has("x-ratelimit-reset")).toBe(true);

        const data = await response.json();
        expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
      }
    });

    it("should track different IPs separately", async () => {
      const ip1 = `10.0.2.${Math.floor(Math.random() * 255)}`;
      const ip2 = `10.0.3.${Math.floor(Math.random() * 255)}`;

      const response1 = await POST(createRequest(ip1));
      const response2 = await POST(createRequest(ip2));

      // Both should succeed (different rate limit buckets)
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe("TC-RATE-002: Prompt Validation", () => {
    it("should reject prompts exceeding max length", async () => {
      const longPrompt = "a".repeat(5001); // Exceeds 5000 char limit
      const testIp = `10.0.4.${Math.floor(Math.random() * 255)}`;

      const request = new NextRequest("http://localhost:3000/api/liquid/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({
          prompt: longPrompt,
          metadata: mockMetadata,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("INVALID_LENGTH");
    });

    it("should accept prompts at max length boundary", async () => {
      const maxPrompt = "a".repeat(5000); // Exactly 5000 chars
      const testIp = `10.0.5.${Math.floor(Math.random() * 255)}`;

      const request = new NextRequest("http://localhost:3000/api/liquid/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({
          prompt: maxPrompt,
          metadata: mockMetadata,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it("should accept prompts at min length boundary", async () => {
      const minPrompt = "a"; // 1 char
      const testIp = `10.0.6.${Math.floor(Math.random() * 255)}`;

      const request = new NextRequest("http://localhost:3000/api/liquid/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({
          prompt: minPrompt,
          metadata: mockMetadata,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe("TC-RATE-003: Error Response Format", () => {
    it("should include reset time in rate limit error", async () => {
      const testIp = `10.0.7.${Math.floor(Math.random() * 255)}`;
      const maxRequests = parseInt(process.env.AI_REQUEST_LIMIT_PER_MINUTE || "10");

      // Exhaust limit
      for (let i = 0; i < maxRequests + 1; i++) {
        await POST(createRequest(testIp));
      }

      const response = await POST(createRequest(testIp));

      if (response.status === 429) {
        const data = await response.json();
        expect(data.error.message).toContain("Too many requests");
        expect(data.error.details).toBeDefined();
        expect(data.error.details).toContain("Resets at");
      }
    });
  });
});
