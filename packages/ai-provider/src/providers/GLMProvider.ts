import {
  BaseOpenAIProvider,
  type OpenAICompatibleConfig,
} from './BaseOpenAIProvider';

/**
 * GLM Provider (Z.AI / OpenAI-compatible)
 * GLM-4.7, GLM-4.5, and other GLM models
 */
export class GLMProvider extends BaseOpenAIProvider {
  public readonly name = 'glm';

  constructor(config: OpenAICompatibleConfig) {
    super({
      ...config,
      baseURL: config.baseURL || 'https://api.z.ai/api/paas/v4',
    });
  }

  /**
   * Cost per 1M input tokens for GLM-4.7: $0.60
   * Source: https://docs.z.ai/guides/overview/pricing
   * https://llm-stats.com/models/glm-4.7
   */
  protected getCostPerInputToken(): number {
    if (this.config.model.includes('glm-4.7')) {
      return 0.60 / 1_000_000; // glm-4.7
    }
    if (this.config.model.includes('glm-4')) {
      return 0.60 / 1_000_000; // glm-4.x series
    }
    return 0.60 / 1_000_000; // default
  }

  /**
   * Cost per 1M output tokens for GLM-4.7: $2.20
   */
  protected getCostPerOutputToken(): number {
    if (this.config.model.includes('glm-4.7')) {
      return 2.20 / 1_000_000; // glm-4.7
    }
    if (this.config.model.includes('glm-4')) {
      return 2.20 / 1_000_000; // glm-4.x series
    }
    return 2.20 / 1_000_000; // default
  }
}
