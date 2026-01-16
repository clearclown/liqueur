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

/**
 * Environment variable configuration for each provider type
 */
const PROVIDER_ENV_MAP: Record<string, Record<string, string | undefined>> = {
  mock: {
    AI_PROVIDER: 'mock',
  },
  openai: {
    AI_PROVIDER: 'openai',
    OPENAI_API_KEY: 'test-openai-key',
    OPENAI_MODEL: 'gpt-4o-mini',
  },
  deepseek: {
    AI_PROVIDER: 'deepseek',
    DEEPSEEK_API_KEY: 'test-deepseek-key',
    DEEPSEEK_MODEL: 'deepseek-chat',
  },
  glm: {
    AI_PROVIDER: 'glm',
    GLM_API_KEY: 'test-glm-key',
    GLM_MODEL: 'glm-4.7',
  },
  local: {
    AI_PROVIDER: 'local',
    LOCAL_LLM_BASE_URL: 'http://localhost:1234/v1',
    LOCAL_LLM_MODEL: 'local-model',
  },
  anthropic: {
    AI_PROVIDER: 'anthropic',
    ANTHROPIC_API_KEY: 'test-anthropic-key',
    ANTHROPIC_MODEL: 'claude-3-haiku-20240307',
  },
  gemini: {
    AI_PROVIDER: 'gemini',
    GOOGLE_API_KEY: 'test-gemini-key',
    GEMINI_MODEL: 'gemini-1.5-flash',
  },
};

/**
 * Sets up environment variables for a specific provider type
 */
export function setupProviderEnv(providerType: string, overrides?: Record<string, string>) {
  const envConfig = PROVIDER_ENV_MAP[providerType];
  if (!envConfig) {
    throw new Error(`Unknown provider type: ${providerType}`);
  }

  Object.entries({ ...envConfig, ...overrides }).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
}

/**
 * Expects provider to be an instance of the expected class with correct name
 */
export function expectProviderInstance(provider: any, expectedClass: any, expectedName: string) {
  expect(provider).toBeInstanceOf(expectedClass);
  expect(provider.name).toBe(expectedName);
  return provider;
}
