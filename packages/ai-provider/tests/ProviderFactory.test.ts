import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProviderFactory } from '../src/factory/ProviderFactory';
import { MockProvider } from '../src/providers/MockProvider';
import { OpenAIProvider } from '../src/providers/OpenAIProvider';
import { DeepSeekProvider } from '../src/providers/DeepSeekProvider';
import { GLMProvider } from '../src/providers/GLMProvider';
import { LocalLLMProvider } from '../src/providers/LocalLLMProvider';
import { AnthropicProvider } from '../src/providers/AnthropicProvider';
import { GeminiProvider } from '../src/providers/GeminiProvider';
import { setupProviderEnv, expectProviderInstance } from './testHelpersBaseAIProvider';

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
      const provider = ProviderFactory.createProvider('mock', { model: 'mock-model' });
      expectProviderInstance(provider, MockProvider, 'mock');
    });

    it('should create OpenAIProvider', () => {
      const provider = ProviderFactory.createProvider('openai', {
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
      });
      expectProviderInstance(provider, OpenAIProvider, 'openai');
    });

    it('should create DeepSeekProvider', () => {
      const provider = ProviderFactory.createProvider('deepseek', {
        apiKey: 'test-key',
        model: 'deepseek-chat',
      });
      expectProviderInstance(provider, DeepSeekProvider, 'deepseek');
    });

    it('should create GLMProvider', () => {
      const provider = ProviderFactory.createProvider('glm', {
        apiKey: 'test-key',
        model: 'glm-4.7',
      });
      expectProviderInstance(provider, GLMProvider, 'glm');
    });

    it('should create LocalLLMProvider', () => {
      const provider = ProviderFactory.createProvider('local', {
        model: 'local-model',
        baseURL: 'http://localhost:1234/v1',
      });
      expectProviderInstance(provider, LocalLLMProvider, 'local');
    });

    it('should create AnthropicProvider', () => {
      const provider = ProviderFactory.createProvider('anthropic', {
        apiKey: 'test-key',
        model: 'claude-3-haiku-20240307',
      });
      expectProviderInstance(provider, AnthropicProvider, 'anthropic');
    });

    it('should create GeminiProvider', () => {
      const provider = ProviderFactory.createProvider('gemini', {
        apiKey: 'test-key',
        model: 'gemini-1.5-flash',
      });
      expectProviderInstance(provider, GeminiProvider, 'gemini');
    });

    it('should throw error for unknown provider type', () => {
      expect(() => {
        ProviderFactory.createProvider('unknown' as any, { model: 'test' });
      }).toThrow('Unknown provider type');
    });
  });

  describe('createFromEnv', () => {
    it('should create provider from AI_PROVIDER=mock', () => {
      setupProviderEnv('mock');
      const provider = ProviderFactory.createFromEnv();
      expectProviderInstance(provider, MockProvider, 'mock');
    });

    it('should create OpenAIProvider from env', () => {
      setupProviderEnv('openai');
      const provider = ProviderFactory.createFromEnv();
      expectProviderInstance(provider, OpenAIProvider, 'openai');
    });

    it('should create DeepSeekProvider from env', () => {
      setupProviderEnv('deepseek');
      const provider = ProviderFactory.createFromEnv();
      expectProviderInstance(provider, DeepSeekProvider, 'deepseek');
    });

    it('should create GLMProvider from env', () => {
      setupProviderEnv('glm');
      const provider = ProviderFactory.createFromEnv();
      expectProviderInstance(provider, GLMProvider, 'glm');
    });

    it('should create LocalLLMProvider from env', () => {
      setupProviderEnv('local');
      const provider = ProviderFactory.createFromEnv();
      expectProviderInstance(provider, LocalLLMProvider, 'local');
    });

    it('should create AnthropicProvider from env', () => {
      setupProviderEnv('anthropic');
      const provider = ProviderFactory.createFromEnv();
      expectProviderInstance(provider, AnthropicProvider, 'anthropic');
    });

    it('should create GeminiProvider from env', () => {
      setupProviderEnv('gemini');
      const provider = ProviderFactory.createFromEnv();
      expectProviderInstance(provider, GeminiProvider, 'gemini');
    });

    it('should default to MockProvider when AI_PROVIDER not set', () => {
      delete process.env.AI_PROVIDER;
      const provider = ProviderFactory.createFromEnv();
      expectProviderInstance(provider, MockProvider, 'mock');
    });

    it('should throw error when required API key is missing', () => {
      setupProviderEnv('openai', { OPENAI_API_KEY: undefined });
      expect(() => {
        ProviderFactory.createFromEnv();
      }).toThrow('API key is required');
    });

    it('should throw error when model is missing', () => {
      setupProviderEnv('openai', { OPENAI_MODEL: undefined });
      expect(() => {
        ProviderFactory.createFromEnv();
      }).toThrow('model is required');
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
