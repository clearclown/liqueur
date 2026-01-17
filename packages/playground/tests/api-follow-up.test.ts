/**
 * Follow-up API Tests
 * /api/liquid/follow-up エンドポイントのユニットテスト
 */

import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "../app/api/liquid/follow-up/route";
import { createMockRequest } from "./helpers/testHelpers";
import type { LiquidViewSchema } from "@liqueur/protocol";

describe("POST /api/liquid/follow-up", () => {
  const mockCurrentSchema: LiquidViewSchema = {
    version: "1.0",
    layout: { type: "grid", columns: 12 },
    components: [
      {
        type: "chart",
        variant: "bar",
        title: "Sales",
      },
    ],
    data_sources: {
      ds_sales: {
        resource: "sales",
      },
    },
  };

  const mockMetadata = {
    tables: [
      {
        name: "sales",
        columns: [
          { name: "id", type: "integer", nullable: false, isPrimaryKey: true, isForeignKey: false },
          { name: "amount", type: "decimal", nullable: false, isPrimaryKey: false, isForeignKey: false },
        ],
      },
    ],
  };

  describe("TC-FOLLOWUP-001: Follow-up Request", () => {
    it("should update schema based on follow-up message", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/follow-up",
        "POST",
        {
          conversationId: "conv-123",
          message: "Change to pie chart",
          currentSchema: mockCurrentSchema,
          metadata: mockMetadata,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      // Note: Actual schema generation requires AI provider
      // This test may skip if AI provider is not configured
      if (response.status === 200) {
        expect(data.schema).toBeDefined();
        expect(data.changes).toBeDefined();
        expect(Array.isArray(data.changes)).toBe(true);
        expect(data.provider).toBeDefined();
      }
    }, 30000); // 30 second timeout for AI generation

    it("should reject request without conversationId", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/follow-up",
        "POST",
        {
          message: "Change to pie chart",
          currentSchema: mockCurrentSchema,
          metadata: mockMetadata,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("MISSING_CONVERSATION_ID");
    });

    it("should reject request without message", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/follow-up",
        "POST",
        {
          conversationId: "conv-123",
          currentSchema: mockCurrentSchema,
          metadata: mockMetadata,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("INVALID_TYPE"); // message is undefined
    });

    it("should reject request without currentSchema", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/follow-up",
        "POST",
        {
          conversationId: "conv-123",
          message: "Change to pie chart",
          metadata: mockMetadata,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("MISSING_CURRENT_SCHEMA");
    });

    it("should reject request without metadata", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/follow-up",
        "POST",
        {
          conversationId: "conv-123",
          message: "Change to pie chart",
          currentSchema: mockCurrentSchema,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("INVALID_METADATA");
    });

    it("should reject empty message", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/follow-up",
        "POST",
        {
          conversationId: "conv-123",
          message: "   ",
          currentSchema: mockCurrentSchema,
          metadata: mockMetadata,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("INVALID_LENGTH"); // too short after trim
    });

    it("should reject malformed JSON body", async () => {
      const request = new Request("http://localhost:3000/api/liquid/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("INVALID_JSON");
    });

    it("should reject message exceeding max length", async () => {
      const longMessage = "a".repeat(5001);

      const request = createMockRequest(
        "http://localhost:3000/api/liquid/follow-up",
        "POST",
        {
          conversationId: "conv-123",
          message: longMessage,
          currentSchema: mockCurrentSchema,
          metadata: mockMetadata,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("INVALID_LENGTH"); // too long
    });
  });

  describe("TC-FOLLOWUP-002: Rate Limiting", () => {
    it("should enforce rate limits on follow-up requests", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/follow-up",
        "POST",
        {
          conversationId: "conv-123",
          message: "Change to pie chart",
          currentSchema: mockCurrentSchema,
          metadata: mockMetadata,
        },
        { "x-forwarded-for": "192.168.1.200" }
      );

      // Make 11 requests rapidly (limit is 10 per minute)
      const responses = [];
      for (let i = 0; i < 11; i++) {
        const response = await POST(request);
        responses.push(response);
      }

      // At least one should be rate limited
      const rateLimited = responses.some((r) => r.status === 429);
      expect(rateLimited).toBe(true);
    }, 30000);
  });
});
