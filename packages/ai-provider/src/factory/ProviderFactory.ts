import type { AIProvider, ProviderConfig, ProviderType } from "../types";
import { MockProvider } from "../providers/MockProvider";
import { OpenAIProvider } from "../providers/OpenAIProvider";
import { DeepSeekProvider } from "../providers/DeepSeekProvider";
import { GLMProvider } from "../providers/GLMProvider";
import { LocalLLMProvider } from "../providers/LocalLLMProvider";
import { AnthropicProvider } from "../providers/AnthropicProvider";
import { GeminiProvider } from "../providers/GeminiProvider";
import type { OpenAICompatibleConfig } from "../providers/BaseOpenAIProvider";
import { getOpenAICompatibleConfig, getBasicProviderConfig, getLocalLLMConfig } from "./envHelpers";

/**
 * Factory for creating AI providers
 * Supports environment variable configuration
 */
export class ProviderFactory {
  /**
   * Create a provider by type with explicit configuration
   */
  static createProvider(type: ProviderType, config: ProviderConfig): AIProvider {
    switch (type) {
      case "mock":
        return new MockProvider(config);

      case "openai":
        return new OpenAIProvider(config as OpenAICompatibleConfig);

      case "deepseek":
        return new DeepSeekProvider(config as OpenAICompatibleConfig);

      case "glm":
        return new GLMProvider(config as OpenAICompatibleConfig);

      case "local":
        return new LocalLLMProvider(config as OpenAICompatibleConfig);

      case "anthropic":
        return new AnthropicProvider(config);

      case "gemini":
        return new GeminiProvider(config);

      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  /**
   * Create a provider from environment variables
   *
   * Environment variables:
   * - AI_PROVIDER: Provider type (mock | openai | deepseek | glm | local | anthropic | gemini)
   * - {PROVIDER}_API_KEY: API key for the provider
   * - {PROVIDER}_MODEL: Model name
   * - {PROVIDER}_BASE_URL: Base URL (for OpenAI-compatible providers)
   */
  static createFromEnv(): AIProvider {
    const providerType = (process.env.AI_PROVIDER as ProviderType) || "mock";

    switch (providerType) {
      case "mock":
        return new MockProvider({
          model: "mock-model",
        });

      case "openai":
        return new OpenAIProvider(getOpenAICompatibleConfig("OPENAI"));

      case "deepseek":
        return new DeepSeekProvider(getOpenAICompatibleConfig("DEEPSEEK"));

      case "glm":
        return new GLMProvider(getOpenAICompatibleConfig("GLM"));

      case "local":
        return new LocalLLMProvider(getLocalLLMConfig());

      case "anthropic":
        return new AnthropicProvider(
          getBasicProviderConfig("ANTHROPIC_API_KEY", "ANTHROPIC_MODEL")
        );

      case "gemini":
        return new GeminiProvider(getBasicProviderConfig("GOOGLE_API_KEY", "GEMINI_MODEL"));

      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  }

  /**
   * Get list of supported provider types
   */
  static getSupportedProviders(): ProviderType[] {
    return ["mock", "openai", "deepseek", "glm", "local", "anthropic", "gemini"];
  }
}
