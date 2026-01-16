/**
 * ProviderFactory Environment Integration Tests
 * .envからProviderFactoryを自動初期化するテスト
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createProviderFromEnv } from "../src/factory/createProviderFromEnv";
import { MockProvider } from "../src/providers/MockProvider";
import { DeepSeekProvider } from "../src/providers/DeepSeekProvider";
import { AnthropicProvider } from "../src/providers/AnthropicProvider";
import { GeminiProvider } from "../src/providers/GeminiProvider";
import { LocalLLMProvider } from "../src/providers/LocalLLMProvider";

describe("ProviderFactory Environment Integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("createProviderFromEnv", () => {
    it("should create DeepSeek provider from env", () => {
      process.env.AI_PROVIDER = "deepseek";
      process.env.DEEPSEEK_API_KEY = "sk-test-key";
      process.env.DEEPSEEK_MODEL = "deepseek-chat";

      const provider = createProviderFromEnv();
      expect(provider).toBeInstanceOf(DeepSeekProvider);
    });

    it("should create Anthropic provider from env", () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";
      process.env.ANTHROPIC_MODEL = "claude-3-haiku-20240307";

      const provider = createProviderFromEnv();
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it("should create Gemini provider from env", () => {
      process.env.AI_PROVIDER = "gemini";
      process.env.GOOGLE_API_KEY = "AIza-test";
      process.env.GEMINI_MODEL = "gemini-1.5-flash";

      const provider = createProviderFromEnv();
      expect(provider).toBeInstanceOf(GeminiProvider);
    });

    it("should create LocalLLM provider from env", () => {
      process.env.AI_PROVIDER = "local";
      process.env.LOCAL_LLM_BASE_URL = "http://localhost:1234/v1";
      process.env.LOCAL_LLM_MODEL = "local-model";

      const provider = createProviderFromEnv();
      expect(provider).toBeInstanceOf(LocalLLMProvider);
    });

    it("should create Mock provider by default", () => {
      delete process.env.AI_PROVIDER;

      const provider = createProviderFromEnv();
      expect(provider).toBeInstanceOf(MockProvider);
    });

    it("should throw error when API key is missing", () => {
      process.env.AI_PROVIDER = "deepseek";
      delete process.env.DEEPSEEK_API_KEY;

      expect(() => createProviderFromEnv()).toThrow("DEEPSEEK_API_KEY is required");
    });
  });
});
