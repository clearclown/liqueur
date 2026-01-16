import OpenAI from 'openai';
import type { ProviderConfig } from '../types';
import { BaseAIProvider } from './BaseAIProvider';

/**
 * Base configuration for OpenAI-compatible providers
 */
export interface OpenAICompatibleConfig extends ProviderConfig {
  baseURL?: string;
}

/**
 * Base provider for OpenAI-compatible APIs
 * Extends BaseAIProvider with OpenAI SDK integration
 * Used by: OpenAI, DeepSeek, GLM-4.7, LocalLLM
 */
export abstract class BaseOpenAIProvider extends BaseAIProvider {
  protected client: OpenAI;
  protected override config: OpenAICompatibleConfig;

  constructor(config: OpenAICompatibleConfig) {
    super(config);
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey || 'not-needed',
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    });
  }

  /**
   * Override isConfigured for local LLM support
   * Local LLMs don't require API keys
   */
  isConfigured(): boolean {
    // For local LLM, API key is not required
    if (this.config.baseURL?.includes('localhost') || this.config.baseURL?.includes('127.0.0.1')) {
      return true;
    }
    return !!this.config.apiKey && this.config.apiKey !== 'not-needed';
  }

  /**
   * Call OpenAI-compatible API with prompt and system message
   */
  protected async callAPI(prompt: string, systemPrompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI provider');
    }

    return content;
  }

  /**
   * Get cost per input token (override in subclass)
   */
  protected abstract getCostPerInputToken(): number;

  /**
   * Get cost per output token (override in subclass)
   */
  protected abstract getCostPerOutputToken(): number;
}
