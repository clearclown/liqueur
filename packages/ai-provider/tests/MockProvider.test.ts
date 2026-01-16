import { describe, it, expect, beforeEach } from 'vitest';
import { MockProvider } from '../src/providers/MockProvider';
import type { DatabaseMetadata, ProviderConfig } from '../src/types';
import {
  createMockConfig,
  createMockMetadata,
  createValidSchema,
  createInvalidSchema,
  expectGenerateSchemaError,
  expectValidationSuccess,
} from './testHelpersBaseAIProvider';

describe('MockProvider', () => {
  let provider: MockProvider;
  let mockMetadata: DatabaseMetadata;

  beforeEach(() => {
    const config = createMockConfig({ model: 'mock-model', apiKey: undefined });
    provider = new MockProvider(config);
    mockMetadata = createMockMetadata();
  });

  describe('constructor', () => {
    it('should create provider with config', () => {
      expect(provider).toBeDefined();
      expect(provider.name).toBe('mock');
    });
  });

  describe('isConfigured', () => {
    it('should always return true for mock provider', () => {
      expect(provider.isConfigured()).toBe(true);
    });
  });

  describe('generateSchema', () => {
    it('should generate valid schema for simple chart request', async () => {
      const schema = await provider.generateSchema('Show me monthly sales as a bar chart', mockMetadata);

      expect(schema).toBeDefined();
      expect(schema.version).toBe('1.0');
      expect(schema.layout.type).toBe('grid');
      expect(schema.components).toHaveLength(1);
      expect(schema.components[0].type).toBe('chart');
      expect(schema.data_sources).toBeDefined();
    });

    it('should generate schema with data_source referencing metadata table', async () => {
      const schema = await provider.generateSchema('Show sales data', mockMetadata);

      const dataSourceNames = Object.keys(schema.data_sources);
      expect(dataSourceNames.length).toBeGreaterThan(0);

      const firstDataSource = schema.data_sources[dataSourceNames[0]];
      expect(firstDataSource.resource).toBe('sales');
    });

    it('should generate schema with multiple components', async () => {
      const schema = await provider.generateSchema('Show sales chart and table', mockMetadata);

      expect(schema.components.length).toBeGreaterThanOrEqual(2);
      const hasChart = schema.components.some((c) => c.type === 'chart');
      const hasTable = schema.components.some((c) => c.type === 'table');
      expect(hasChart).toBe(true);
      expect(hasTable).toBe(true);
    });

    it('should throw error for empty prompt', async () => {
      await expectGenerateSchemaError(provider, '', mockMetadata, 'Prompt cannot be empty');
    });

    it('should throw error for empty metadata', async () => {
      const emptyMetadata = createMockMetadata([]);
      await expectGenerateSchemaError(provider, 'Show sales', emptyMetadata, 'Database metadata cannot be empty');
    });
  });

  describe('validateResponse', () => {
    it('should validate correct schema structure', () => {
      const validSchema = createValidSchema({
        components: [{ type: 'chart', variant: 'bar', data_source: 'ds_sales' }],
        data_sources: { ds_sales: { resource: 'sales' } },
      });

      const result = provider.validateResponse(validSchema);
      expectValidationSuccess(result, validSchema);
    });

    it('should reject invalid schema - missing version', () => {
      const invalidSchema = createInvalidSchema('version');
      const result = provider.validateResponse(invalidSchema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toContain('MISSING_VERSION');
    });

    it('should reject invalid schema - missing layout', () => {
      const invalidSchema = createInvalidSchema('layout');
      const result = provider.validateResponse(invalidSchema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid schema - missing components', () => {
      const invalidSchema = createInvalidSchema('components');
      const result = provider.validateResponse(invalidSchema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toContain('MISSING_COMPONENTS');
    });

    it('should reject invalid schema - missing data_sources', () => {
      const invalidSchema = createInvalidSchema('data_sources');
      const result = provider.validateResponse(invalidSchema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toContain('MISSING_DATA_SOURCES');
    });

    it('should reject non-object response', () => {
      const result = provider.validateResponse('not an object');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject null response', () => {
      const result = provider.validateResponse(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('estimateCost', () => {
    it('should return zero cost for mock provider', () => {
      const estimate = provider.estimateCost('Show me sales data');

      expect(estimate.estimatedCost).toBe(0);
      expect(estimate.currency).toBe('USD');
      expect(estimate.model).toBe('mock-model');
      expect(estimate.inputTokens).toBeGreaterThan(0);
      expect(estimate.outputTokens).toBeGreaterThan(0);
    });

    it('should estimate tokens proportional to prompt length', () => {
      const shortEstimate = provider.estimateCost('Sales');
      const longEstimate = provider.estimateCost('Show me a detailed analysis of monthly sales data with charts and tables');

      expect(longEstimate.inputTokens).toBeGreaterThan(shortEstimate.inputTokens);
    });
  });
});
