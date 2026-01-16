import { describe, it, expect, beforeEach } from 'vitest';
import { OpenAIProvider } from '../src/providers/OpenAIProvider';
import { DeepSeekProvider } from '../src/providers/DeepSeekProvider';
import { GLMProvider } from '../src/providers/GLMProvider';
import { LocalLLMProvider } from '../src/providers/LocalLLMProvider';
import type { DatabaseMetadata, OpenAICompatibleConfig } from '../src';
import { createMockMetadata } from './testHelpers';

describe('OpenAI-Compatible Providers', () => {
  let mockMetadata: DatabaseMetadata;
  let baseConfig: OpenAICompatibleConfig;

  beforeEach(() => {
    mockMetadata = createMockMetadata();

    baseConfig = {
      apiKey: 'test-api-key',
      model: 'test-model',
      timeout: 5000,
    };
  });

  describe('OpenAIProvider', () => {
    it('should create provider with default baseURL', () => {
      const provider = new OpenAIProvider(baseConfig);
      expect(provider.name).toBe('openai');
      expect(provider.isConfigured()).toBe(true);
    });

    it('should create provider with custom baseURL', () => {
      const provider = new OpenAIProvider({
        ...baseConfig,
        baseURL: 'https://custom.openai.com/v1',
      });
      expect(provider.name).toBe('openai');
    });

    it('should estimate cost for GPT-4o-mini', () => {
      const provider = new OpenAIProvider({
        ...baseConfig,
        model: 'gpt-4o-mini',
      });
      const estimate = provider.estimateCost('Test prompt');
      expect(estimate.estimatedCost).toBeGreaterThan(0);
      expect(estimate.currency).toBe('USD');
      expect(estimate.model).toBe('gpt-4o-mini');
    });

    it('should estimate higher cost for GPT-4', () => {
      const providerMini = new OpenAIProvider({
        ...baseConfig,
        model: 'gpt-4o-mini',
      });
      const provider4 = new OpenAIProvider({
        ...baseConfig,
        model: 'gpt-4-turbo',
      });

      const estimateMini = providerMini.estimateCost('Test prompt');
      const estimate4 = provider4.estimateCost('Test prompt');

      expect(estimate4.estimatedCost).toBeGreaterThan(estimateMini.estimatedCost);
    });
  });

  describe('DeepSeekProvider', () => {
    it('should create provider with default baseURL', () => {
      const provider = new DeepSeekProvider(baseConfig);
      expect(provider.name).toBe('deepseek');
      expect(provider.isConfigured()).toBe(true);
    });

    it('should use DeepSeek baseURL', () => {
      const provider = new DeepSeekProvider(baseConfig);
      expect(provider.name).toBe('deepseek');
    });

    it('should estimate cost for deepseek-chat', () => {
      const provider = new DeepSeekProvider({
        ...baseConfig,
        model: 'deepseek-chat',
      });
      const estimate = provider.estimateCost('Test prompt');
      expect(estimate.estimatedCost).toBeGreaterThan(0);
      expect(estimate.currency).toBe('USD');
    });
  });

  describe('GLMProvider', () => {
    it('should create provider with default Z.AI baseURL', () => {
      const provider = new GLMProvider(baseConfig);
      expect(provider.name).toBe('glm');
      expect(provider.isConfigured()).toBe(true);
    });

    it('should support OpenRouter baseURL', () => {
      const provider = new GLMProvider({
        ...baseConfig,
        baseURL: 'https://openrouter.ai/api/v1',
      });
      expect(provider.name).toBe('glm');
    });

    it('should estimate cost for GLM-4.7', () => {
      const provider = new GLMProvider({
        ...baseConfig,
        model: 'glm-4.7',
      });
      const estimate = provider.estimateCost('Test prompt');
      expect(estimate.estimatedCost).toBeGreaterThan(0);
      expect(estimate.currency).toBe('USD');
      expect(estimate.model).toBe('glm-4.7');
    });
  });

  describe('LocalLLMProvider', () => {
    it('should create provider with localhost baseURL', () => {
      const provider = new LocalLLMProvider(baseConfig);
      expect(provider.name).toBe('local');
      expect(provider.isConfigured()).toBe(true);
    });

    it('should not require API key', () => {
      const provider = new LocalLLMProvider({
        ...baseConfig,
        apiKey: undefined,
      });
      expect(provider.isConfigured()).toBe(true);
    });

    it('should have zero cost', () => {
      const provider = new LocalLLMProvider({
        ...baseConfig,
        model: 'local-model',
      });
      const estimate = provider.estimateCost('Test prompt');
      expect(estimate.estimatedCost).toBe(0);
      expect(estimate.currency).toBe('USD');
    });

    it('should support custom local endpoint', () => {
      const provider = new LocalLLMProvider({
        ...baseConfig,
        baseURL: 'http://localhost:8080/v1',
      });
      expect(provider.name).toBe('local');
    });
  });

  describe('Validation', () => {
    it('should validate correct schema structure', () => {
      const provider = new OpenAIProvider(baseConfig);
      const validSchema = {
        version: '1.0',
        layout: { type: 'grid', columns: 1 },
        components: [
          {
            type: 'chart',
            variant: 'bar',
            data_source: 'ds_sales',
          },
        ],
        data_sources: {
          ds_sales: {
            resource: 'sales',
          },
        },
      };

      const result = provider.validateResponse(validSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid schema across all providers', () => {
      const providers = [
        new OpenAIProvider(baseConfig),
        new DeepSeekProvider(baseConfig),
        new GLMProvider(baseConfig),
        new LocalLLMProvider(baseConfig),
      ];

      const invalidSchema = { version: '1.0' }; // Missing required fields

      providers.forEach((provider) => {
        const result = provider.validateResponse(invalidSchema);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Cost Comparison', () => {
    it('should show LocalLLM has lowest cost', () => {
      const prompt = 'Generate a sales dashboard';

      const openai = new OpenAIProvider({ ...baseConfig, model: 'gpt-4o-mini' });
      const deepseek = new DeepSeekProvider({ ...baseConfig, model: 'deepseek-chat' });
      const glm = new GLMProvider({ ...baseConfig, model: 'glm-4.7' });
      const local = new LocalLLMProvider({ ...baseConfig, model: 'local-model' });

      const costs = [
        { name: 'OpenAI', cost: openai.estimateCost(prompt).estimatedCost },
        { name: 'DeepSeek', cost: deepseek.estimateCost(prompt).estimatedCost },
        { name: 'GLM', cost: glm.estimateCost(prompt).estimatedCost },
        { name: 'Local', cost: local.estimateCost(prompt).estimatedCost },
      ];

      expect(costs.find((c) => c.name === 'Local')?.cost).toBe(0);
      costs.forEach((c) => {
        if (c.name !== 'Local') {
          expect(c.cost).toBeGreaterThan(0);
        }
      });
    });
  });
});
