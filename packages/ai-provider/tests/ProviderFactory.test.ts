import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProviderFactory } from '../src/factory/ProviderFactory';
import { MockProvider } from '../src/providers/MockProvider';
import { OpenAIProvider } from '../src/providers/OpenAIProvider';
import { DeepSeekProvider } from '../src/providers/DeepSeekProvider';
import { GLMProvider } from '../src/providers/GLMProvider';
import { LocalLLMProvider } from '../src/providers/LocalLLMProvider';
import { AnthropicProvider } from '../src/providers/AnthropicProvider';
import { GeminiProvider } from '../src/providers/GeminiProvider';

describe('ProviderFactory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('createProvider', () => {
    it('should create MockProvider', () => {
      const provider = ProviderFactory.createProvider('mock', {
        model: 'mock-model',
      });

      expect(provider).toBeInstanceOf(MockProvider);
      expect(provider.name).toBe('mock');
    });

    it('should create OpenAIProvider', () => {
      const provider = ProviderFactory.createProvider('openai', {
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
      });

      expect(provider).toBeInstanceOf(OpenAIProvider);
      expect(provider.name).toBe('openai');
    });

    it('should create DeepSeekProvider', () => {
      const provider = ProviderFactory.createProvider('deepseek', {
        apiKey: 'test-key',
        model: 'deepseek-chat',
      });

      expect(provider).toBeInstanceOf(DeepSeekProvider);
      expect(provider.name).toBe('deepseek');
    });

    it('should create GLMProvider', () => {
      const provider = ProviderFactory.createProvider('glm', {
        apiKey: 'test-key',
        model: 'glm-4.7',
      });

      expect(provider).toBeInstanceOf(GLMProvider);
      expect(provider.name).toBe('glm');
    });

    it('should create LocalLLMProvider', () => {
      const provider = ProviderFactory.createProvider('local', {
        model: 'local-model',
        baseURL: 'http://localhost:1234/v1',
      });

      expect(provider).toBeInstanceOf(LocalLLMProvider);
      expect(provider.name).toBe('local');
    });

    it('should create AnthropicProvider', () => {
      const provider = ProviderFactory.createProvider('anthropic', {
        apiKey: 'test-key',
        model: 'claude-3-haiku-20240307',
      });

      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(provider.name).toBe('anthropic');
    });

    it('should create GeminiProvider', () => {
      const provider = ProviderFactory.createProvider('gemini', {
        apiKey: 'test-key',
        model: 'gemini-1.5-flash',
      });

      expect(provider).toBeInstanceOf(GeminiProvider);
      expect(provider.name).toBe('gemini');
    });

    it('should throw error for unknown provider type', () => {
      expect(() => {
        ProviderFactory.createProvider('unknown' as any, { model: 'test' });
      }).toThrow('Unknown provider type');
    });
  });

  describe('createFromEnv', () => {
    it('should create provider from AI_PROVIDER=mock', () => {
      process.env.AI_PROVIDER = 'mock';

      const provider = ProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(MockProvider);
    });

    it('should create OpenAIProvider from env', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.OPENAI_MODEL = 'gpt-4o-mini';

      const provider = ProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should create DeepSeekProvider from env', () => {
      process.env.AI_PROVIDER = 'deepseek';
      process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
      process.env.DEEPSEEK_MODEL = 'deepseek-chat';

      const provider = ProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(DeepSeekProvider);
    });

    it('should create GLMProvider from env', () => {
      process.env.AI_PROVIDER = 'glm';
      process.env.GLM_API_KEY = 'test-glm-key';
      process.env.GLM_MODEL = 'glm-4.7';

      const provider = ProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(GLMProvider);
    });

    it('should create LocalLLMProvider from env', () => {
      process.env.AI_PROVIDER = 'local';
      process.env.LOCAL_LLM_BASE_URL = 'http://localhost:1234/v1';
      process.env.LOCAL_LLM_MODEL = 'local-model';

      const provider = ProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(LocalLLMProvider);
    });

    it('should create AnthropicProvider from env', () => {
      process.env.AI_PROVIDER = 'anthropic';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.ANTHROPIC_MODEL = 'claude-3-haiku-20240307';

      const provider = ProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it('should create GeminiProvider from env', () => {
      process.env.AI_PROVIDER = 'gemini';
      process.env.GOOGLE_API_KEY = 'test-gemini-key';
      process.env.GEMINI_MODEL = 'gemini-1.5-flash';

      const provider = ProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(GeminiProvider);
    });

    it('should default to MockProvider when AI_PROVIDER not set', () => {
      delete process.env.AI_PROVIDER;

      const provider = ProviderFactory.createFromEnv();

      expect(provider).toBeInstanceOf(MockProvider);
    });

    it('should throw error when required API key is missing', () => {
      process.env.AI_PROVIDER = 'openai';
      delete process.env.OPENAI_API_KEY;

      expect(() => {
        ProviderFactory.createFromEnv();
      }).toThrow('API key is required');
    });

    it('should throw error when model is missing', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'test-key';
      delete process.env.OPENAI_MODEL;

      expect(() => {
        ProviderFactory.createFromEnv();
      }).toThrow('OpenAI model is required');
    });
  });

  describe('getSupportedProviders', () => {
    it('should return all supported provider types', () => {
      const providers = ProviderFactory.getSupportedProviders();

      expect(providers).toContain('mock');
      expect(providers).toContain('openai');
      expect(providers).toContain('deepseek');
      expect(providers).toContain('glm');
      expect(providers).toContain('local');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('gemini');
      expect(providers).toHaveLength(7);
    });
  });
});
