import { BaseOpenAIProvider, type OpenAICompatibleConfig } from "./BaseOpenAIProvider";

/**
 * DeepSeek AI Provider (OpenAI-compatible)
 * DeepSeek Chat, DeepSeek Coder
 */
export class DeepSeekProvider extends BaseOpenAIProvider {
  public readonly name = "deepseek";

  constructor(config: OpenAICompatibleConfig) {
    super({
      ...config,
      baseURL: config.baseURL || "https://api.deepseek.com",
    });
  }

  /**
   * Cost per 1M input tokens for DeepSeek-V3: $0.27
   * Source: https://platform.deepseek.com/api-docs/pricing/
   */
  protected getCostPerInputToken(): number {
    if (this.config.model.includes("deepseek-chat")) {
      return 0.27 / 1_000_000; // deepseek-chat (V3)
    }
    if (this.config.model.includes("deepseek-coder")) {
      return 0.27 / 1_000_000; // deepseek-coder
    }
    return 0.27 / 1_000_000; // default
  }

  /**
   * Cost per 1M output tokens for DeepSeek-V3: $1.10
   */
  protected getCostPerOutputToken(): number {
    if (this.config.model.includes("deepseek-chat")) {
      return 1.1 / 1_000_000; // deepseek-chat (V3)
    }
    if (this.config.model.includes("deepseek-coder")) {
      return 1.1 / 1_000_000; // deepseek-coder
    }
    return 1.1 / 1_000_000; // default
  }
}
