import { BaseOpenAIProvider, type OpenAICompatibleConfig } from "./BaseOpenAIProvider";

/**
 * OpenAI Provider (GPT-4, GPT-3.5, etc.)
 * Official OpenAI API
 */
export class OpenAIProvider extends BaseOpenAIProvider {
  public readonly name = "openai";

  constructor(config: OpenAICompatibleConfig) {
    super({
      ...config,
      baseURL: config.baseURL || "https://api.openai.com/v1",
    });
  }

  /**
   * Cost per 1M input tokens for GPT-4o-mini: $0.15
   * Source: https://openai.com/api/pricing/
   */
  protected getCostPerInputToken(): number {
    if (this.config.model.includes("gpt-4o")) {
      return 0.15 / 1_000_000; // gpt-4o-mini
    }
    if (this.config.model.includes("gpt-4")) {
      return 5.0 / 1_000_000; // gpt-4-turbo
    }
    if (this.config.model.includes("gpt-3.5")) {
      return 0.5 / 1_000_000; // gpt-3.5-turbo
    }
    return 0.15 / 1_000_000; // default to gpt-4o-mini
  }

  /**
   * Cost per 1M output tokens for GPT-4o-mini: $0.60
   */
  protected getCostPerOutputToken(): number {
    if (this.config.model.includes("gpt-4o")) {
      return 0.6 / 1_000_000; // gpt-4o-mini
    }
    if (this.config.model.includes("gpt-4")) {
      return 15.0 / 1_000_000; // gpt-4-turbo
    }
    if (this.config.model.includes("gpt-3.5")) {
      return 1.5 / 1_000_000; // gpt-3.5-turbo
    }
    return 0.6 / 1_000_000; // default to gpt-4o-mini
  }
}
