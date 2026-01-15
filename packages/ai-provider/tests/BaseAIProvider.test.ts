import { describe, it, expect, beforeEach } from 'vitest';
import { BaseAIProvider } from '../src/providers/BaseAIProvider';
import type { DatabaseMetadata, ProviderConfig } from '../src/types';

/**
 * Mock implementation of BaseAIProvider for testing
 */
class MockAIProvider extends BaseAIProvider {
  public readonly name = 'mock-base';
  public mockResponseText = '{"version":"1.0","layout":{"type":"grid","columns":1},"components":[],"data_sources":{}}';
  public shouldThrowAPIError = false;

  protected async callAPI(_prompt: string, _systemPrompt: string): Promise<string> {
    if (this.shouldThrowAPIError) {
      throw new Error('Mock API error');
    }
    return this.mockResponseText;
  }

  protected getCostPerInputToken(): number {
    return 0.001 / 1_000_000; // $0.001 per MTok
  }

  protected getCostPerOutputToken(): number {
    return 0.002 / 1_000_000; // $0.002 per MTok
  }
}

describe('BaseAIProvider', () => {
  let provider: MockAIProvider;
  let mockMetadata: DatabaseMetadata;
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      model: 'test-model',
      timeout: 5000,
    };

    provider = new MockAIProvider(config);

    mockMetadata = {
      tables: [
        {
          name: 'sales',
          columns: [
            {
              name: 'id',
              type: 'integer',
              nullable: false,
              isPrimaryKey: true,
              isForeignKey: false,
            },
          ],
          rowCount: 10,
        },
      ],
    };
  });

  describe('isConfigured', () => {
    it('should return true when API key is provided', () => {
      expect(provider.isConfigured()).toBe(true);
    });

    it('should return false when API key is missing', () => {
      const providerNoKey = new MockAIProvider({ ...config, apiKey: undefined });
      expect(providerNoKey.isConfigured()).toBe(false);
    });

    it('should return false when API key is empty', () => {
      const providerEmptyKey = new MockAIProvider({ ...config, apiKey: '' });
      expect(providerEmptyKey.isConfigured()).toBe(false);
    });
  });

  describe('generateSchema', () => {
    it('should generate valid schema', async () => {
      const prompt = 'Show me sales data';

      const schema = await provider.generateSchema(prompt, mockMetadata);

      expect(schema).toBeDefined();
      expect(schema.version).toBe('1.0');
      expect(schema.layout).toBeDefined();
      expect(schema.components).toBeDefined();
      expect(schema.data_sources).toBeDefined();
    });

    it('should throw error for empty prompt', async () => {
      await expect(provider.generateSchema('', mockMetadata)).rejects.toThrow(
        'Prompt cannot be empty'
      );
    });

    it('should throw error for empty metadata', async () => {
      const emptyMetadata: DatabaseMetadata = { tables: [] };

      await expect(
        provider.generateSchema('Show sales', emptyMetadata)
      ).rejects.toThrow('Database metadata cannot be empty');
    });

    it('should throw error when JSON parsing fails', async () => {
      provider.mockResponseText = 'invalid json';

      await expect(
        provider.generateSchema('Show sales', mockMetadata)
      ).rejects.toThrow('Failed to parse AI response as JSON');
    });

    it('should throw error when validation fails', async () => {
      provider.mockResponseText = '{"invalid":"schema"}';

      await expect(
        provider.generateSchema('Show sales', mockMetadata)
      ).rejects.toThrow('Invalid schema generated');
    });

    it('should throw error when API call fails', async () => {
      provider.shouldThrowAPIError = true;

      await expect(
        provider.generateSchema('Show sales', mockMetadata)
      ).rejects.toThrow('Mock API error');
    });
  });

  describe('validateResponse', () => {
    it('should validate correct schema structure', () => {
      const validSchema = {
        version: '1.0',
        layout: { type: 'grid', columns: 1 },
        components: [],
        data_sources: {},
      };

      const result = provider.validateResponse(validSchema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.schema).toEqual(validSchema);
    });

    it('should reject non-object response', () => {
      const result = provider.validateResponse('not an object');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_RESPONSE_TYPE' })
      );
    });

    it('should reject null response', () => {
      const result = provider.validateResponse(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_RESPONSE_TYPE' })
      );
    });

    it('should reject missing version', () => {
      const schema = {
        layout: { type: 'grid', columns: 1 },
        components: [],
        data_sources: {},
      };

      const result = provider.validateResponse(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_VERSION' })
      );
    });

    it('should reject missing layout', () => {
      const schema = {
        version: '1.0',
        components: [],
        data_sources: {},
      };

      const result = provider.validateResponse(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_LAYOUT' })
      );
    });

    it('should reject missing components', () => {
      const schema = {
        version: '1.0',
        layout: { type: 'grid', columns: 1 },
        data_sources: {},
      };

      const result = provider.validateResponse(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_COMPONENTS' })
      );
    });

    it('should reject missing data_sources', () => {
      const schema = {
        version: '1.0',
        layout: { type: 'grid', columns: 1 },
        components: [],
      };

      const result = provider.validateResponse(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_DATA_SOURCES' })
      );
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost based on prompt length', () => {
      const prompt = 'Show me sales data';

      const estimate = provider.estimateCost(prompt);

      expect(estimate.estimatedCost).toBeGreaterThan(0);
      expect(estimate.currency).toBe('USD');
      expect(estimate.model).toBe('test-model');
      expect(estimate.inputTokens).toBeGreaterThan(0);
      expect(estimate.outputTokens).toBe(1000);
    });

    it('should estimate more tokens for longer prompts', () => {
      const shortPrompt = 'Sales';
      const longPrompt = 'Show me a detailed analysis of sales data with charts';

      const shortEstimate = provider.estimateCost(shortPrompt);
      const longEstimate = provider.estimateCost(longPrompt);

      expect(longEstimate.inputTokens).toBeGreaterThan(shortEstimate.inputTokens);
      expect(longEstimate.estimatedCost).toBeGreaterThan(shortEstimate.estimatedCost);
    });
  });

  describe('buildSystemPrompt', () => {
    it('should build system prompt with metadata', () => {
      // Access protected method via type assertion for testing
      const systemPrompt = (provider as any).buildSystemPrompt(mockMetadata);

      expect(systemPrompt).toContain('LiquidView schema generator');
      expect(systemPrompt).toContain('OUTPUT ONLY JSON');
      expect(systemPrompt).toContain('sales');
      expect(systemPrompt).toContain('SCHEMA SPECIFICATION');
    });

    it('should include all table names in prompt', () => {
      const multiTableMetadata: DatabaseMetadata = {
        tables: [
          { ...mockMetadata.tables[0], name: 'sales' },
          { ...mockMetadata.tables[0], name: 'users' },
          { ...mockMetadata.tables[0], name: 'products' },
        ],
      };

      const systemPrompt = (provider as any).buildSystemPrompt(multiTableMetadata);

      expect(systemPrompt).toContain('sales');
      expect(systemPrompt).toContain('users');
      expect(systemPrompt).toContain('products');
    });
  });
});
