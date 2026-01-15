import {
  BaseOpenAIProvider,
  type OpenAICompatibleConfig,
} from './BaseOpenAIProvider';

/**
 * Local LLM Provider (LM Studio, Ollama, etc.)
 * OpenAI-compatible local endpoints
 */
export class LocalLLMProvider extends BaseOpenAIProvider {
  public readonly name = 'local';

  constructor(config: OpenAICompatibleConfig) {
    super({
      ...config,
      baseURL: config.baseURL || 'http://localhost:1234/v1',
      apiKey: 'not-needed', // Local LLM doesn't need API key
    });
  }

  /**
   * Local LLM has zero cost
   */
  protected getCostPerInputToken(): number {
    return 0;
  }

  /**
   * Local LLM has zero cost
   */
  protected getCostPerOutputToken(): number {
    return 0;
  }

  /**
   * Local LLM is always configured if the endpoint is accessible
   */
  isConfigured(): boolean {
    return true;
  }
}
