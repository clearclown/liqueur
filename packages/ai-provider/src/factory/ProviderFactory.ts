import type { AIProvider, ProviderConfig, ProviderType } from '../types';
import { MockProvider } from '../providers/MockProvider';
import { OpenAIProvider } from '../providers/OpenAIProvider';
import { DeepSeekProvider } from '../providers/DeepSeekProvider';
import { GLMProvider } from '../providers/GLMProvider';
import { LocalLLMProvider } from '../providers/LocalLLMProvider';
import { AnthropicProvider } from '../providers/AnthropicProvider';
import { GeminiProvider } from '../providers/GeminiProvider';
import type { OpenAICompatibleConfig } from '../providers/BaseOpenAIProvider';

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
      case 'mock':
        return new MockProvider(config);

      case 'openai':
        return new OpenAIProvider(config as OpenAICompatibleConfig);

      case 'deepseek':
        return new DeepSeekProvider(config as OpenAICompatibleConfig);

      case 'glm':
        return new GLMProvider(config as OpenAICompatibleConfig);

      case 'local':
        return new LocalLLMProvider(config as OpenAICompatibleConfig);

      case 'anthropic':
        return new AnthropicProvider(config);

      case 'gemini':
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
    const providerType = (process.env.AI_PROVIDER as ProviderType) || 'mock';

    switch (providerType) {
      case 'mock':
        return new MockProvider({
          model: 'mock-model',
        });

      case 'openai': {
        const apiKey = process.env.OPENAI_API_KEY;
        const model = process.env.OPENAI_MODEL;
        const baseURL = process.env.OPENAI_BASE_URL;

        if (!apiKey) {
          throw new Error('OpenAI API key is required: set OPENAI_API_KEY');
        }
        if (!model) {
          throw new Error('OpenAI model is required: set OPENAI_MODEL');
        }

        return new OpenAIProvider({
          apiKey,
          model,
          baseURL,
        });
      }

      case 'deepseek': {
        const apiKey = process.env.DEEPSEEK_API_KEY;
        const model = process.env.DEEPSEEK_MODEL;
        const baseURL = process.env.DEEPSEEK_BASE_URL;

        if (!apiKey) {
          throw new Error('DeepSeek API key is required: set DEEPSEEK_API_KEY');
        }
        if (!model) {
          throw new Error('DeepSeek model is required: set DEEPSEEK_MODEL');
        }

        return new DeepSeekProvider({
          apiKey,
          model,
          baseURL,
        });
      }

      case 'glm': {
        const apiKey = process.env.GLM_API_KEY;
        const model = process.env.GLM_MODEL;
        const baseURL = process.env.GLM_BASE_URL;

        if (!apiKey) {
          throw new Error('GLM API key is required: set GLM_API_KEY');
        }
        if (!model) {
          throw new Error('GLM model is required: set GLM_MODEL');
        }

        return new GLMProvider({
          apiKey,
          model,
          baseURL,
        });
      }

      case 'local': {
        const model = process.env.LOCAL_LLM_MODEL || 'local-model';
        const baseURL = process.env.LOCAL_LLM_BASE_URL || 'http://localhost:1234/v1';

        return new LocalLLMProvider({
          model,
          baseURL,
        });
      }

      case 'anthropic': {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        const model = process.env.ANTHROPIC_MODEL;

        if (!apiKey) {
          throw new Error('Anthropic API key is required: set ANTHROPIC_API_KEY');
        }
        if (!model) {
          throw new Error('Anthropic model is required: set ANTHROPIC_MODEL');
        }

        return new AnthropicProvider({
          apiKey,
          model,
        });
      }

      case 'gemini': {
        const apiKey = process.env.GOOGLE_API_KEY;
        const model = process.env.GEMINI_MODEL;

        if (!apiKey) {
          throw new Error('Gemini API key is required: set GOOGLE_API_KEY');
        }
        if (!model) {
          throw new Error('Gemini model is required: set GEMINI_MODEL');
        }

        return new GeminiProvider({
          apiKey,
          model,
        });
      }

      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  }

  /**
   * Get list of supported provider types
   */
  static getSupportedProviders(): ProviderType[] {
    return ['mock', 'openai', 'deepseek', 'glm', 'local', 'anthropic', 'gemini'];
  }
}
