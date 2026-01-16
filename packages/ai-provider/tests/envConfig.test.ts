/**
 * Environment Configuration Tests
 * AI Provider設定を.envから読み込むテスト
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getProviderFromEnv,
  getDeepSeekConfig,
  getAnthropicConfig,
  getGeminiConfig,
  getLocalLLMConfig,
  getCostTrackingConfig,
  getRateLimitConfig,
  getAIConfig,
} from "../src/config/envConfig";

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 各テストで環境変数をリセット
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("AI Provider Selection", () => {
    it("should read AI_PROVIDER from environment", () => {
      process.env.AI_PROVIDER = "deepseek";

      const provider = getProviderFromEnv();
      expect(provider).toBe("deepseek");
    });

    it("should default to mock provider when AI_PROVIDER is not set", () => {
      delete process.env.AI_PROVIDER;

      const provider = getProviderFromEnv();
      expect(provider).toBe("mock");
    });

    it("should validate provider type", () => {
      process.env.AI_PROVIDER = "invalid-provider";

      expect(() => getProviderFromEnv()).toThrow("Unsupported AI provider");
    });
  });

  describe("DeepSeek Configuration", () => {
    it("should read DeepSeek API key from environment", () => {
      process.env.DEEPSEEK_API_KEY = "sk-test-key";
      process.env.DEEPSEEK_MODEL = "deepseek-chat";

      const config = getDeepSeekConfig();
      expect(config.apiKey).toBe("sk-test-key");
      expect(config.model).toBe("deepseek-chat");
      expect(config.baseURL).toBe("https://api.deepseek.com/v1");
    });

    it("should throw error when DeepSeek API key is missing", () => {
      delete process.env.DEEPSEEK_API_KEY;

      expect(() => getDeepSeekConfig()).toThrow("DEEPSEEK_API_KEY is required");
    });

    it("should use default model when DEEPSEEK_MODEL is not set", () => {
      process.env.DEEPSEEK_API_KEY = "sk-test-key";
      delete process.env.DEEPSEEK_MODEL;

      const config = getDeepSeekConfig();
      expect(config.model).toBe("deepseek-chat");
    });
  });

  describe("Anthropic Configuration", () => {
    it("should read Anthropic API key from environment", () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";
      process.env.ANTHROPIC_MODEL = "claude-3-haiku-20240307";

      const config = getAnthropicConfig();
      expect(config.apiKey).toBe("sk-ant-test");
      expect(config.model).toBe("claude-3-haiku-20240307");
    });

    it("should throw error when Anthropic API key is missing", () => {
      delete process.env.ANTHROPIC_API_KEY;

      expect(() => getAnthropicConfig()).toThrow("ANTHROPIC_API_KEY is required");
    });
  });

  describe("Gemini Configuration", () => {
    it("should read Google API key from environment", () => {
      process.env.GOOGLE_API_KEY = "AIza-test";
      process.env.GEMINI_MODEL = "gemini-1.5-flash";

      const config = getGeminiConfig();
      expect(config.apiKey).toBe("AIza-test");
      expect(config.model).toBe("gemini-1.5-flash");
    });

    it("should throw error when Google API key is missing", () => {
      delete process.env.GOOGLE_API_KEY;

      expect(() => getGeminiConfig()).toThrow("GOOGLE_API_KEY is required");
    });
  });

  describe("Local LLM Configuration", () => {
    it("should read Local LLM configuration from environment", () => {
      process.env.LOCAL_LLM_BASE_URL = "http://localhost:1234/v1";
      process.env.LOCAL_LLM_MODEL = "local-model";

      const config = getLocalLLMConfig();
      expect(config.baseURL).toBe("http://localhost:1234/v1");
      expect(config.model).toBe("local-model");
    });

    it("should use default base URL when not set", () => {
      delete process.env.LOCAL_LLM_BASE_URL;
      process.env.LOCAL_LLM_MODEL = "local-model";

      const config = getLocalLLMConfig();
      expect(config.baseURL).toBe("http://localhost:1234/v1");
    });
  });

  describe("Cost Tracking Configuration", () => {
    it("should read cost tracking settings from environment", () => {
      process.env.ENABLE_COST_TRACKING = "true";
      process.env.COST_ALERT_THRESHOLD = "10.00";

      const config = getCostTrackingConfig();
      expect(config.enabled).toBe(true);
      expect(config.alertThreshold).toBe(10.0);
    });

    it("should parse boolean values correctly", () => {
      process.env.ENABLE_COST_TRACKING = "false";

      const config = getCostTrackingConfig();
      expect(config.enabled).toBe(false);
    });

    it("should parse numeric values correctly", () => {
      process.env.COST_ALERT_THRESHOLD = "25.50";

      const config = getCostTrackingConfig();
      expect(config.alertThreshold).toBe(25.5);
    });
  });

  describe("Rate Limiting Configuration", () => {
    it("should read rate limiting settings from environment", () => {
      process.env.AI_REQUEST_LIMIT_PER_MINUTE = "10";
      process.env.AI_REQUEST_LIMIT_PER_HOUR = "100";

      const config = getRateLimitConfig();
      expect(config.perMinute).toBe(10);
      expect(config.perHour).toBe(100);
    });

    it("should use default values when not set", () => {
      delete process.env.AI_REQUEST_LIMIT_PER_MINUTE;
      delete process.env.AI_REQUEST_LIMIT_PER_HOUR;

      const config = getRateLimitConfig();
      expect(config.perMinute).toBe(10);
      expect(config.perHour).toBe(100);
    });
  });

  describe("Full AI Configuration", () => {
    it("should compose full AI configuration", () => {
      process.env.AI_PROVIDER = "deepseek";
      process.env.ENABLE_COST_TRACKING = "true";
      process.env.COST_ALERT_THRESHOLD = "15.00";
      process.env.AI_REQUEST_LIMIT_PER_MINUTE = "5";
      process.env.AI_REQUEST_LIMIT_PER_HOUR = "50";
      process.env.AI_REQUEST_TIMEOUT = "60000";
      process.env.VERBOSE_AI_LOGGING = "true";

      const config = getAIConfig();
      expect(config.provider).toBe("deepseek");
      expect(config.costTracking.enabled).toBe(true);
      expect(config.costTracking.alertThreshold).toBe(15.0);
      expect(config.rateLimit.perMinute).toBe(5);
      expect(config.rateLimit.perHour).toBe(50);
      expect(config.timeout).toBe(60000);
      expect(config.verboseLogging).toBe(true);
    });
  });
});
