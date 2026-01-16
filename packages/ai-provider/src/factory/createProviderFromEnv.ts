/**
 * Environment-based Provider Factory
 * .envから自動的にAIプロバイダーを作成
 */

import type { AIProvider } from "../types";
import { MockProvider } from "../providers/MockProvider";
import { DeepSeekProvider } from "../providers/DeepSeekProvider";
import { AnthropicProvider } from "../providers/AnthropicProvider";
import { GeminiProvider } from "../providers/GeminiProvider";
import { OpenAIProvider } from "../providers/OpenAIProvider";
import { GLMProvider } from "../providers/GLMProvider";
import { LocalLLMProvider } from "../providers/LocalLLMProvider";
import {
  getProviderFromEnv,
  getDeepSeekConfig,
  getAnthropicConfig,
  getGeminiConfig,
  getOpenAIConfig,
  getGLMConfig,
  getLocalLLMConfig,
} from "../config/envConfig";

/**
 * 環境変数から適切なAIプロバイダーを自動作成
 *
 * @example
 * ```typescript
 * // .envでAI_PROVIDER=deepseek, DEEPSEEK_API_KEY=...を設定
 * const provider = createProviderFromEnv();
 * const response = await provider.generate({ prompt: "Hello" });
 * ```
 */
export function createProviderFromEnv(): AIProvider {
  const providerType = getProviderFromEnv();

  switch (providerType) {
    case "deepseek": {
      const config = getDeepSeekConfig();
      return new DeepSeekProvider(config);
    }

    case "anthropic": {
      const config = getAnthropicConfig();
      return new AnthropicProvider(config);
    }

    case "gemini": {
      const config = getGeminiConfig();
      return new GeminiProvider(config);
    }

    case "openai": {
      const config = getOpenAIConfig();
      return new OpenAIProvider({ apiKey: config.apiKey, model: config.model });
    }

    case "glm": {
      const config = getGLMConfig();
      return new GLMProvider(config);
    }

    case "local": {
      const config = getLocalLLMConfig();
      return new LocalLLMProvider(config);
    }

    case "mock":
    default: {
      return new MockProvider();
    }
  }
}
