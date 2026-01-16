import { describe, it, expect, beforeEach } from "vitest";
import { GeminiProvider } from "../src/providers/GeminiProvider";
import type { DatabaseMetadata, ProviderConfig } from "../src/types";
import {
  createMockConfig,
  createMockMetadata,
  createValidSchema,
  createInvalidSchema,
  expectValidationSuccess,
} from "./testHelpersBaseAIProvider";

describe("GeminiProvider", () => {
  let provider: GeminiProvider;
  let mockMetadata: DatabaseMetadata;
  let config: ProviderConfig;

  beforeEach(() => {
    config = createMockConfig({
      apiKey: "test-gemini-key",
      model: "gemini-1.5-flash",
    });

    provider = new GeminiProvider(config);
    mockMetadata = createMockMetadata();
  });

  describe("constructor", () => {
    it("should create provider with config", () => {
      expect(provider).toBeDefined();
      expect(provider.name).toBe("gemini");
    });
  });

  describe("isConfigured", () => {
    it("should return true when API key is provided", () => {
      expect(provider.isConfigured()).toBe(true);
    });

    it("should return false when API key is missing", () => {
      const providerNoKey = new GeminiProvider({
        ...config,
        apiKey: undefined,
      });
      expect(providerNoKey.isConfigured()).toBe(false);
    });

    it("should return false when API key is empty", () => {
      const providerEmptyKey = new GeminiProvider({
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

    it("should reject non-object response", () => {
      const result = provider.validateResponse("not an object");

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("estimateCost", () => {
    it("should estimate cost for Gemini 1.5 Flash", () => {
      const prompt = "Show me sales data";

      const estimate = provider.estimateCost(prompt);

      expect(estimate.estimatedCost).toBeGreaterThan(0);
      expect(estimate.currency).toBe("USD");
      expect(estimate.model).toBe("gemini-1.5-flash");
      expect(estimate.inputTokens).toBeGreaterThan(0);
      expect(estimate.outputTokens).toBeGreaterThan(0);
    });

    it("should estimate tokens proportional to prompt length", () => {
      const shortPrompt = "Sales";
      const longPrompt = "Show me a detailed analysis of monthly sales data";

      const shortEstimate = provider.estimateCost(shortPrompt);
      const longEstimate = provider.estimateCost(longPrompt);

      expect(longEstimate.inputTokens).toBeGreaterThan(shortEstimate.inputTokens);
    });

    it("should estimate higher cost for Gemini 1.5 Pro", () => {
      const providerFlash = new GeminiProvider({
        ...config,
        model: "gemini-1.5-flash",
      });
      const providerPro = new GeminiProvider({
        ...config,
        model: "gemini-1.5-pro",
      });

      const prompt = "Show sales";
      const estimateFlash = providerFlash.estimateCost(prompt);
      const estimatePro = providerPro.estimateCost(prompt);

      expect(estimatePro.estimatedCost).toBeGreaterThan(estimateFlash.estimatedCost);
    });

    it("should have zero cost for Gemini 2.0 Flash (free tier)", () => {
      const providerFree = new GeminiProvider({
        ...config,
        model: "gemini-2.0-flash-exp",
      });

      const prompt = "Show sales";
      const estimate = providerFree.estimateCost(prompt);

      expect(estimate.estimatedCost).toBe(0);
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
  });
});
