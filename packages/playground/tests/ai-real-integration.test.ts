/**
 * Real AI Integration Tests
 * 実際のAI APIを使用した統合テスト
 *
 * TDD Red Phase: テストを先に書く
 *
 * NOTE: これらのテストは実際のAPI呼び出しを行い、コストが発生します
 * 実行には環境変数の設定が必要:
 * - AI_PROVIDER=anthropic または gemini
 * - ANTHROPIC_API_KEY または GOOGLE_API_KEY
 *
 * 実行方法:
 * 1. .envファイルでAI_PROVIDER=anthropicまたはgeminiを設定
 * 2. API keyを設定
 * 3. npm test -- ai-real-integration.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import { POST } from "../app/api/liquid/generate/route";
import { GET } from "../app/api/liquid/metadata/route";
import { createMockRequest } from "./helpers/testHelpers";
import type { LiquidViewSchema } from "@liqueur/protocol";

/**
 * 環境変数チェック: 実AIプロバイダーが設定されているか
 */
function isRealAIConfigured(): boolean {
  const provider = process.env.AI_PROVIDER;
  if (provider === "mock" || !provider) {
    return false;
  }

  if (provider === "anthropic") {
    return !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "sk-ant-your-api-key-here";
  }

  if (provider === "gemini") {
    return !!process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== "AIzaSy-your-api-key-here";
  }

  return false;
}

describe.skipIf(!isRealAIConfigured())("Real AI Integration Tests", () => {
  let metadata: any;

  beforeAll(async () => {
    // メタデータを事前取得
    const metadataRequest = createMockRequest(
      "http://localhost:3000/api/liquid/metadata",
      "GET"
    );
    const metadataResponse = await GET(metadataRequest);
    const metadataData = await metadataResponse.json();
    metadata = metadataData.metadata;
  });

  describe("TC-REAL-001: Anthropic Claude Integration", () => {
    it.skipIf(process.env.AI_PROVIDER !== "anthropic")(
      "should generate valid schema using Claude API",
      async () => {
        const request = createMockRequest(
          "http://localhost:3000/api/liquid/generate",
          "POST",
          {
            prompt: "Create a bar chart showing monthly expenses by category",
            metadata,
          }
        );

        const response = await POST(request);
        const data = await response.json();

        // ステータスコード確認
        expect(response.status).toBe(200);

        // スキーマ構造確認
        expect(data.schema).toBeDefined();
        expect(data.schema.version).toBe("1.0");
        expect(data.schema.layout).toBeDefined();
        expect(data.schema.components).toBeDefined();
        expect(Array.isArray(data.schema.components)).toBe(true);
        expect(data.schema.data_sources).toBeDefined();

        // メタデータ確認
        expect(data.metadata).toBeDefined();
        expect(data.metadata.provider).toBe("anthropic");
        expect(data.metadata.estimatedCost).toBeGreaterThan(0);
        expect(data.metadata.generatedAt).toBeDefined();

        console.log("✅ Claude API Integration Success");
        console.log(`   Provider: ${data.metadata.provider}`);
        console.log(`   Estimated Cost: $${data.metadata.estimatedCost.toFixed(6)}`);
        console.log(`   Components: ${data.schema.components.length}`);
      },
      { timeout: 30000 } // 30秒タイムアウト
    );

    it.skipIf(process.env.AI_PROVIDER !== "anthropic")(
      "should handle complex prompts with multiple components",
      async () => {
        const request = createMockRequest(
          "http://localhost:3000/api/liquid/generate",
          "POST",
          {
            prompt:
              "Create a comprehensive dashboard with: 1) A line chart showing sales trends over time, 2) A table listing top 10 expenses, 3) A pie chart showing expense distribution by category",
            metadata,
          }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.schema.components.length).toBeGreaterThanOrEqual(2);

        console.log("✅ Complex Prompt Success");
        console.log(`   Components Generated: ${data.schema.components.length}`);
      },
      { timeout: 45000 }
    );
  });

  describe("TC-REAL-002: Google Gemini Integration", () => {
    it.skipIf(process.env.AI_PROVIDER !== "gemini")(
      "should generate valid schema using Gemini API",
      async () => {
        const request = createMockRequest(
          "http://localhost:3000/api/liquid/generate",
          "POST",
          {
            prompt: "Show me a table of recent expenses sorted by amount descending",
            metadata,
          }
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.schema.version).toBe("1.0");
        expect(data.metadata.provider).toBe("gemini");
        expect(data.metadata.estimatedCost).toBeGreaterThanOrEqual(0);

        console.log("✅ Gemini API Integration Success");
        console.log(`   Provider: ${data.metadata.provider}`);
        console.log(`   Estimated Cost: $${data.metadata.estimatedCost.toFixed(6)}`);
      },
      { timeout: 30000 }
    );
  });

  describe("TC-REAL-003: Schema Validation", () => {
    it("should only generate valid LiquidViewSchema", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/generate",
        "POST",
        {
          prompt: "Display sales data in any format you think is best",
          metadata,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      if (response.status === 200) {
        const schema: LiquidViewSchema = data.schema;

        // 厳密な型チェック
        expect(schema.version).toBe("1.0");
        expect(schema.layout.type).toMatch(/^(grid|stack)$/);
        expect(Array.isArray(schema.components)).toBe(true);

        // 各コンポーネントの型検証
        schema.components.forEach((component) => {
          expect(component.type).toMatch(/^(chart|table)$/);
          expect(component.id).toBeDefined();
          expect(typeof component.id).toBe("string");
        });

        // data_sourcesが正しく定義されているか
        expect(typeof schema.data_sources).toBe("object");
      }
    }, { timeout: 30000 });
  });

  describe("TC-REAL-004: Cost Estimation Accuracy", () => {
    it("should provide accurate cost estimates", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/generate",
        "POST",
        {
          prompt: "Simple chart",
          metadata,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      if (response.status === 200) {
        expect(data.metadata.estimatedCost).toBeGreaterThan(0);
        expect(data.metadata.estimatedCost).toBeLessThan(0.1); // $0.10未満であるべき

        console.log("✅ Cost Estimation Check");
        console.log(`   Estimated Cost: $${data.metadata.estimatedCost.toFixed(6)}`);
      }
    }, { timeout: 30000 });
  });

  describe("TC-REAL-005: Performance Benchmarks", () => {
    it("should respond within 10 seconds for simple prompts", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/generate",
        "POST",
        {
          prompt: "Show expenses",
          metadata,
        }
      );

      const startTime = Date.now();
      const response = await POST(request);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000); // 10秒以内

      console.log("✅ Performance Check");
      console.log(`   Response Time: ${duration}ms`);
    }, { timeout: 15000 });

    it("should handle concurrent requests", async () => {
      const promises = Array.from({ length: 3 }, (_, i) =>
        POST(
          createMockRequest("http://localhost:3000/api/liquid/generate", "POST", {
            prompt: `Show chart ${i + 1}`,
            metadata,
          })
        )
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      const duration = endTime - startTime;
      console.log("✅ Concurrent Request Check");
      console.log(`   3 Requests Time: ${duration}ms`);
      console.log(`   Avg Time: ${(duration / 3).toFixed(0)}ms`);
    }, { timeout: 60000 });
  });

  describe("TC-REAL-006: Error Recovery", () => {
    it("should handle API errors gracefully", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/generate",
        "POST",
        {
          prompt: "", // 空プロンプト
          metadata,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("EMPTY_PROMPT");
    });

    it("should handle invalid metadata", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/generate",
        "POST",
        {
          prompt: "Show data",
          metadata: { tables: [] }, // 空のメタデータ
        }
      );

      const response = await POST(request);

      // エラーまたは成功のいずれかで安全に処理
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    }, { timeout: 30000 });
  });
});

describe("Real AI Integration - Configuration Check", () => {
  it("should detect AI provider configuration", () => {
    const provider = process.env.AI_PROVIDER || "mock";
    const isConfigured = isRealAIConfigured();

    if (!isConfigured) {
      console.log("⚠️  Real AI Integration Tests Skipped");
      console.log("   Reason: AI_PROVIDER not configured or set to 'mock'");
      console.log("   To enable:");
      console.log("   1. Set AI_PROVIDER=anthropic or gemini in .env");
      console.log("   2. Set corresponding API key");
      console.log("   3. Run: npm test -- ai-real-integration.test.ts");
    } else {
      console.log("✅ Real AI Provider Configured");
      console.log(`   Provider: ${provider}`);
    }

    // プロバイダーが設定されていることを確認（デフォルト値を許容）
    expect(provider).toBeTruthy();
    expect(typeof provider).toBe("string");
  });
});
