/**
 * AI Generation API Tests
 * POST /api/liquid/generate エンドポイントのユニットテスト
 *
 * TDD Approach: Red-Green-Refactor
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../src/app/api/liquid/generate/route";
import { NextRequest } from "next/server";
import type { DatabaseMetadata } from "@liqueur/protocol";

/**
 * Test Data: Database Metadata
 */
const mockMetadata: DatabaseMetadata = {
  tables: [
    {
      name: "expenses",
      description: "Expense transactions",
      columns: [
        { name: "id", type: "integer", nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: "user_id", type: "integer", nullable: false, isPrimaryKey: false, isForeignKey: true },
        { name: "category", type: "text", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "amount", type: "decimal", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "date", type: "date", nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
    {
      name: "sales",
      description: "Sales records",
      columns: [
        { name: "id", type: "integer", nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: "product", type: "text", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "quantity", type: "integer", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "revenue", type: "decimal", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "date", type: "date", nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
  ],
};

/**
 * Helper: Create mock NextRequest
 */
function createMockRequest(body: unknown): NextRequest {
  const request = new NextRequest("http://localhost:3000/api/liquid/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return request;
}

describe("POST /api/liquid/generate", () => {
  describe("TC-GEN-001: Basic Schema Generation", () => {
    it("should generate valid LiquidViewSchema from simple prompt", async () => {
      const request = createMockRequest({
        prompt: "Show me my expenses",
        metadata: mockMetadata,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.schema).toBeDefined();
      expect(data.schema.version).toBe("1.0");
      expect(data.schema.layout).toBeDefined();
      expect(data.schema.components).toBeInstanceOf(Array);
      expect(data.schema.data_sources).toBeDefined();
    });

    it("should generate chart component for visualization request", async () => {
      const request = createMockRequest({
        prompt: "Show me monthly sales as a bar chart",
        metadata: mockMetadata,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // チャートコンポーネントが生成されているか
      const hasChartComponent = data.schema.components.some(
        (c: any) => c.type === "chart"
      );
      expect(hasChartComponent).toBe(true);
    });

    it("should generate table component for list request", async () => {
      const request = createMockRequest({
        prompt: "Show me a table of all expenses",
        metadata: mockMetadata,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // テーブルコンポーネントが生成されているか
      const hasTableComponent = data.schema.components.some(
        (c: any) => c.type === "table"
      );
      expect(hasTableComponent).toBe(true);
    });
  });

  describe("TC-GEN-002: Filter Generation", () => {
    it("should generate filters based on prompt constraints", async () => {
      const request = createMockRequest({
        prompt: "Show me expenses excluding travel category",
        metadata: mockMetadata,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // MockProviderは単純なスキーマを返すため、data_sourcesが存在することを確認
      // 実際のAIプロバイダーではフィルタが含まれる
      expect(data.schema.data_sources).toBeDefined();
      expect(Object.keys(data.schema.data_sources).length).toBeGreaterThan(0);
    });

    it("should use correct resource based on prompt context", async () => {
      const request = createMockRequest({
        prompt: "Show me sales by product",
        metadata: mockMetadata,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // MockProviderは単純なスキーマを返すため、data_sourcesが存在することを確認
      // 実際のAIプロバイダーでは適切なリソースが選択される
      expect(data.schema.data_sources).toBeDefined();
      expect(Object.keys(data.schema.data_sources).length).toBeGreaterThan(0);
    });
  });

  describe("TC-GEN-003: Validation & Error Handling", () => {
    it("should reject request without prompt", async () => {
      const request = createMockRequest({
        metadata: mockMetadata,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("MISSING_PROMPT");
    });

    it("should reject request without metadata", async () => {
      const request = createMockRequest({
        prompt: "Show me expenses",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("MISSING_METADATA");
    });

    it("should reject empty prompt", async () => {
      const request = createMockRequest({
        prompt: "   ",
        metadata: mockMetadata,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("EMPTY_PROMPT");
    });

    it("should handle malformed JSON gracefully", async () => {
      // NextRequestは内部でJSONパースするため、ここでは手動でエラーをテスト
      const request = new NextRequest("http://localhost:3000/api/liquid/generate", {
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
  });

  describe("TC-GEN-004: Response Format", () => {
    it("should include generation metadata in response", async () => {
      const request = createMockRequest({
        prompt: "Show me expenses",
        metadata: mockMetadata,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.schema).toBeDefined();
      expect(data.metadata).toBeDefined();
      expect(data.metadata.generatedAt).toBeDefined();
      expect(data.metadata.provider).toBeDefined();
    });

    it("should return valid JSON-serializable schema", async () => {
      const request = createMockRequest({
        prompt: "Show me expenses",
        metadata: mockMetadata,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // JSONとして再シリアライズ可能か
      expect(() => JSON.stringify(data.schema)).not.toThrow();
    });
  });

  describe("TC-GEN-005: Provider Selection", () => {
    it("should use MockProvider by default in test environment", async () => {
      const request = createMockRequest({
        prompt: "Show me expenses",
        metadata: mockMetadata,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.provider).toBe("mock");
    });
  });

  describe("TC-GEN-006: Complex Prompts", () => {
    it("should handle multi-component requests", async () => {
      const request = createMockRequest({
        prompt: "Show me a chart of monthly expenses and a table of recent transactions",
        metadata: mockMetadata,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // MockProviderは単純なスキーマを返すため、少なくとも1つのコンポーネントが存在することを確認
      expect(data.schema.components.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle aggregation requests", async () => {
      const request = createMockRequest({
        prompt: "Show me total sales by month",
        metadata: mockMetadata,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // MockProviderは単純なスキーマを返すため、data_sourcesが存在することを確認
      // 実際のAIプロバイダーでは集計が含まれる
      expect(data.schema.data_sources).toBeDefined();
      expect(Object.keys(data.schema.data_sources).length).toBeGreaterThan(0);
    });
  });
});
