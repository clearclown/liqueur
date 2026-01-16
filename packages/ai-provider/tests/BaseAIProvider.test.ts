import { describe, it, expect, beforeEach } from "vitest";
import { BaseAIProvider } from "../src/providers/BaseAIProvider";
import type { DatabaseMetadata, ProviderConfig } from "../src/types";
import {
  createMockConfig,
  createMockMetadata,
  createValidSchema,
  createInvalidSchema,
  expectGenerateSchemaSuccess,
  expectGenerateSchemaError,
  expectValidationSuccess,
  expectValidationError,
  expectValidCostEstimate,
} from "./testHelpersBaseAIProvider";

/**
 * Mock implementation of BaseAIProvider for testing
 */
class MockAIProvider extends BaseAIProvider {
  public readonly name = "mock-base";
  public mockResponseText =
    '{"version":"1.0","layout":{"type":"grid","columns":1},"components":[],"data_sources":{}}';
  public shouldThrowAPIError = false;

  protected async callAPI(_prompt: string, _systemPrompt: string): Promise<string> {
    if (this.shouldThrowAPIError) {
      throw new Error("Mock API error");
    }
    return this.mockResponseText;
  }

  protected getCostPerInputToken(): number {
    return 0.001 / 1_000_000; // $0.001 per MTok
  }

  protected getCostPerOutputToken(): number {
    return 0.002 / 1_000_000; // $0.002 per MTok
  }
}

describe("BaseAIProvider", () => {
  let provider: MockAIProvider;
  let mockMetadata: DatabaseMetadata;
  let config: ProviderConfig;

  beforeEach(() => {
    config = createMockConfig();
    provider = new MockAIProvider(config);
    mockMetadata = createMockMetadata();
  });

  describe("isConfigured", () => {
    it("should return true when API key is provided", () => {
      expect(provider.isConfigured()).toBe(true);
    });

    it("should return false when API key is missing", () => {
      const providerNoKey = new MockAIProvider(createMockConfig({ apiKey: undefined }));
      expect(providerNoKey.isConfigured()).toBe(false);
    });

    it("should return false when API key is empty", () => {
      const providerEmptyKey = new MockAIProvider(createMockConfig({ apiKey: "" }));
      expect(providerEmptyKey.isConfigured()).toBe(false);
    });
  });

  describe("generateSchema", () => {
    it("should generate valid schema", async () => {
      await expectGenerateSchemaSuccess(provider, "Show me sales data", mockMetadata);
    });

    it("should throw error for empty prompt", async () => {
      await expectGenerateSchemaError(provider, "", mockMetadata, "Prompt cannot be empty");
    });

    it("should throw error for empty metadata", async () => {
      const emptyMetadata = createMockMetadata([]);
      await expectGenerateSchemaError(
        provider,
        "Show sales",
        emptyMetadata,
        "Database metadata cannot be empty"
      );
    });

    it("should throw error when JSON parsing fails", async () => {
      provider.mockResponseText = "invalid json";
      await expectGenerateSchemaError(
        provider,
        "Show sales",
        mockMetadata,
        "Failed to parse AI response as JSON"
      );
    });

    it("should throw error when validation fails", async () => {
      provider.mockResponseText = '{"invalid":"schema"}';
      await expectGenerateSchemaError(
        provider,
        "Show sales",
        mockMetadata,
        "Invalid schema generated"
      );
    });

    it("should throw error when API call fails", async () => {
      provider.shouldThrowAPIError = true;
      await expectGenerateSchemaError(provider, "Show sales", mockMetadata, "Mock API error");
    });
  });

  describe("validateResponse", () => {
    it("should validate correct schema structure", () => {
      const validSchema = createValidSchema();
      const result = provider.validateResponse(validSchema);
      expectValidationSuccess(result, validSchema);
    });

    it("should reject non-object response", () => {
      const result = provider.validateResponse("not an object");
      expectValidationError(result, "INVALID_RESPONSE_TYPE");
    });

    it("should reject null response", () => {
      const result = provider.validateResponse(null);
      expectValidationError(result, "INVALID_RESPONSE_TYPE");
    });

    it("should reject missing version", () => {
      const schema = createInvalidSchema("version");
      const result = provider.validateResponse(schema);
      expectValidationError(result, "MISSING_VERSION");
    });

    it("should reject missing layout", () => {
      const schema = createInvalidSchema("layout");
      const result = provider.validateResponse(schema);
      expectValidationError(result, "MISSING_LAYOUT");
    });

    it("should reject missing components", () => {
      const schema = createInvalidSchema("components");
      const result = provider.validateResponse(schema);
      expectValidationError(result, "MISSING_COMPONENTS");
    });

    it("should reject missing data_sources", () => {
      const schema = createInvalidSchema("data_sources");
      const result = provider.validateResponse(schema);
      expectValidationError(result, "MISSING_DATA_SOURCES");
    });
  });

  describe("estimateCost", () => {
    it("should estimate cost based on prompt length", () => {
      const estimate = provider.estimateCost("Show me sales data");
      expectValidCostEstimate(estimate);
      expect(estimate.model).toBe("test-model");
    });

    it("should estimate more tokens for longer prompts", () => {
      const shortEstimate = provider.estimateCost("Sales");
      const longEstimate = provider.estimateCost(
        "Show me a detailed analysis of sales data with charts"
      );

      expect(longEstimate.inputTokens).toBeGreaterThan(shortEstimate.inputTokens);
      expect(longEstimate.estimatedCost).toBeGreaterThan(shortEstimate.estimatedCost);
    });
  });

  describe("buildSystemPrompt", () => {
    it("should build system prompt with metadata", () => {
      const systemPrompt = (provider as any).buildSystemPrompt(mockMetadata);

      expect(systemPrompt).toContain("LiquidView schema generator");
      expect(systemPrompt).toContain("OUTPUT ONLY JSON");
      expect(systemPrompt).toContain("sales");
      expect(systemPrompt).toContain("SCHEMA SPECIFICATION");
    });

    it("should include all table names in prompt", () => {
      const multiTableMetadata = createMockMetadata([
        { name: "sales", rowCount: 10 },
        { name: "users", rowCount: 50 },
        { name: "products", rowCount: 30 },
      ]);

      const systemPrompt = (provider as any).buildSystemPrompt(multiTableMetadata);

      expect(systemPrompt).toContain("sales");
      expect(systemPrompt).toContain("users");
      expect(systemPrompt).toContain("products");
    });
  });
});
