/**
 * Test Helper Functions for BaseAIProvider Tests
 * Reduces duplication in BaseAIProvider.test.ts
 */

import { expect } from 'vitest';
import { BaseAIProvider } from '../src/providers/BaseAIProvider';
import type { DatabaseMetadata, ProviderConfig, ValidationResult } from '../src/types';

/**
 * Creates a mock AI provider configuration
 */
export function createMockConfig(overrides?: Partial<ProviderConfig>): ProviderConfig {
  return {
    apiKey: 'test-api-key',
    model: 'test-model',
    timeout: 5000,
    ...overrides,
  };
}

/**
 * Creates mock database metadata
 */
export function createMockMetadata(
  tables?: Array<{ name: string; columns?: any[]; rowCount?: number }>
): DatabaseMetadata {
  const defaultTable = {
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
  };

  return {
    tables: tables || [defaultTable],
  };
}

/**
 * Creates a valid LiquidView schema object
 */
export function createValidSchema(overrides?: any) {
  return {
    version: '1.0',
    layout: { type: 'grid', columns: 1 },
    components: [],
    data_sources: {},
    ...overrides,
  };
}

/**
 * Creates an invalid schema missing a specific field
 */
export function createInvalidSchema(missingField: 'version' | 'layout' | 'components' | 'data_sources') {
  const base: any = {
    version: '1.0',
    layout: { type: 'grid', columns: 1 },
    components: [],
    data_sources: {},
  };

  delete base[missingField];
  return base;
}

/**
 * Expects generateSchema to succeed and return valid schema
 */
export async function expectGenerateSchemaSuccess(
  provider: BaseAIProvider,
  prompt: string,
  metadata: DatabaseMetadata
) {
  const schema = await provider.generateSchema(prompt, metadata);

  expect(schema).toBeDefined();
  expect(schema.version).toBe('1.0');
  expect(schema.layout).toBeDefined();
  expect(schema.components).toBeDefined();
  expect(schema.data_sources).toBeDefined();

  return schema;
}

/**
 * Expects generateSchema to throw an error
 */
export async function expectGenerateSchemaError(
  provider: BaseAIProvider,
  prompt: string,
  metadata: DatabaseMetadata,
  errorMessage: string
) {
  await expect(provider.generateSchema(prompt, metadata)).rejects.toThrow(errorMessage);
}

/**
 * Expects validation to succeed
 */
export function expectValidationSuccess(result: ValidationResult, expectedSchema?: any) {
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);

  if (expectedSchema) {
    expect(result.schema).toEqual(expectedSchema);
  }

  return result;
}

/**
 * Expects validation to fail with specific error code
 */
export function expectValidationError(result: ValidationResult, errorCode: string) {
  expect(result.valid).toBe(false);
  expect(result.errors).toContainEqual(
    expect.objectContaining({ code: errorCode })
  );

  return result;
}

/**
 * Expects cost estimate to have valid structure
 */
export function expectValidCostEstimate(estimate: any) {
  expect(estimate.estimatedCost).toBeGreaterThan(0);
  expect(estimate.currency).toBe('USD');
  expect(estimate.model).toBeDefined();
  expect(estimate.inputTokens).toBeGreaterThan(0);
  expect(estimate.outputTokens).toBe(1000);

  return estimate;
}
