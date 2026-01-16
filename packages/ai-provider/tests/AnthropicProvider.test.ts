import { describe, it, expect, beforeEach } from "vitest";
import { AnthropicProvider } from "../src/providers/AnthropicProvider";
import type { DatabaseMetadata, ProviderConfig } from "../src/types";
import {
  createMockConfig,
  createMockMetadata,
  createValidSchema,
  createInvalidSchema,
  createMultiTableMetadata,
  expectValidationSuccess,
} from "./testHelpersBaseAIProvider";

describe("AnthropicProvider", () => {
  let provider: AnthropicProvider;
  let mockMetadata: DatabaseMetadata;
  let config: ProviderConfig;

  beforeEach(() => {
    config = createMockConfig({
      apiKey: "test-anthropic-key",
      model: "claude-3-haiku-20240307",
    });

    provider = new AnthropicProvider(config);
    mockMetadata = createMockMetadata();
  });

  describe("constructor", () => {
    it("should create provider with config", () => {
      expect(provider).toBeDefined();
      expect(provider.name).toBe("anthropic");
    });
  });

  describe("isConfigured", () => {
    it("should return true when API key is provided", () => {
      expect(provider.isConfigured()).toBe(true);
    });

    it("should return false when API key is missing", () => {
      const providerNoKey = new AnthropicProvider({
        ...config,
        apiKey: undefined,
      });
      expect(providerNoKey.isConfigured()).toBe(false);
    });

    it("should return false when API key is empty", () => {
      const providerEmptyKey = new AnthropicProvider({
        ...config,
        apiKey: "",
      });
      expect(providerEmptyKey.isConfigured()).toBe(false);
    });
  });

  describe("validateResponse", () => {
    it("should validate correct schema structure", () => {
      const validSchema = createValidSchema();
      const result = provider.validateResponse(validSchema);
      expectValidationSuccess(result, validSchema);
    });

    it("should reject invalid schema - missing version", () => {
      const invalidSchema = createInvalidSchema("version");
      const result = provider.validateResponse(invalidSchema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toContain("MISSING_VERSION");
    });

    it("should reject invalid schema - missing layout", () => {
      const invalidSchema = createInvalidSchema("layout");
      const result = provider.validateResponse(invalidSchema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject non-object response", () => {
      const result = provider.validateResponse("not an object");

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject null response", () => {
      const result = provider.validateResponse(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("estimateCost", () => {
    it("should estimate cost for Claude 3 Haiku", () => {
      const prompt = "Show me sales data";

      const estimate = provider.estimateCost(prompt);

      expect(estimate.estimatedCost).toBeGreaterThan(0);
      expect(estimate.currency).toBe("USD");
      expect(estimate.model).toBe("claude-3-haiku-20240307");
      expect(estimate.inputTokens).toBeGreaterThan(0);
      expect(estimate.outputTokens).toBeGreaterThan(0);
    });

    it("should estimate tokens proportional to prompt length", () => {
      const shortPrompt = "Sales";
      const longPrompt = "Show me a detailed analysis of monthly sales data with charts";

      const shortEstimate = provider.estimateCost(shortPrompt);
      const longEstimate = provider.estimateCost(longPrompt);

      expect(longEstimate.inputTokens).toBeGreaterThan(shortEstimate.inputTokens);
    });

    it("should estimate higher cost for Claude 3 Sonnet", () => {
      const providerHaiku = new AnthropicProvider({
        ...config,
        model: "claude-3-haiku-20240307",
      });
      const providerSonnet = new AnthropicProvider({
        ...config,
        model: "claude-3-5-sonnet-20241022",
      });

      const prompt = "Show sales";
      const estimateHaiku = providerHaiku.estimateCost(prompt);
      const estimateSonnet = providerSonnet.estimateCost(prompt);

      expect(estimateSonnet.estimatedCost).toBeGreaterThan(estimateHaiku.estimatedCost);
    });
  });

  describe("buildSystemPrompt", () => {
    it("should build system prompt with metadata", () => {
      // Access protected method via type assertion for testing
      const systemPrompt = (provider as any).buildSystemPrompt(mockMetadata);

      expect(systemPrompt).toContain("LiquidView schema generator");
      expect(systemPrompt).toContain("OUTPUT ONLY JSON");
      expect(systemPrompt).toContain("sales");
      expect(systemPrompt).toContain("SCHEMA SPECIFICATION");
    });

    it("should include all table names in prompt", () => {
      const multiTableMetadata = createMultiTableMetadata(["sales", "users", "products"]);

      const systemPrompt = (provider as any).buildSystemPrompt(multiTableMetadata);

      expect(systemPrompt).toContain("sales");
      expect(systemPrompt).toContain("users");
      expect(systemPrompt).toContain("products");
    });
  });
});
