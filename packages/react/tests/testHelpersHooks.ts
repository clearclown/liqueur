/**
 * Test Helper Functions for useLiquidView Hook Tests
 * Reduces duplication in useLiquidView.test.ts
 */

import { renderHook, waitFor, RenderHookResult } from '@testing-library/react';
import { expect } from 'vitest';
import { useLiquidView, UseLiquidViewResult } from '../src/hooks/useLiquidView';
import type { LiquidViewSchema, DataSource } from '@liqueur/protocol';

/**
 * Creates a minimal test schema with defaults
 * Can accept either data_sources object or full schema overrides
 */
export function createTestSchema(
  dataSourcesOrOverrides: Record<string, DataSource> | Partial<LiquidViewSchema>
): LiquidViewSchema {
  // Check if it's a data_sources object or full schema overrides
  const isDataSources = dataSourcesOrOverrides &&
    Object.values(dataSourcesOrOverrides).some(val =>
      typeof val === 'object' && 'resource' in val
    );

  if (isDataSources) {
    return {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: dataSourcesOrOverrides as Record<string, DataSource>,
    } as LiquidViewSchema;
  }

  return {
    version: '1.0',
    layout: { type: 'grid', columns: 1 },
    components: [],
    data_sources: {},
    ...dataSourcesOrOverrides,
  } as LiquidViewSchema;
}

/**
 * Renders useLiquidView hook with the given schema
 */
export function renderUseLiquidViewHook(schema: LiquidViewSchema) {
  return renderHook(() => useLiquidView({ schema }));
}

/**
 * Waits for the hook to complete loading
 */
export async function waitForHookComplete(
  result: RenderHookResult<UseLiquidViewResult, unknown>['result']
) {
  await waitFor(() => expect(result.current.loading).toBe(false));
}

/**
 * Expects the hook result to have data for the given data source name
 * Optionally checks for expected properties in the first data item
 */
export function expectHookHasData(
  result: RenderHookResult<UseLiquidViewResult, unknown>['result'],
  dsName: string,
  expectedProps?: string[]
) {
  expect(result.current.data[dsName]).toBeDefined();
  expect(result.current.data[dsName].length).toBeGreaterThan(0);

  if (expectedProps) {
    const firstItem = result.current.data[dsName][0];
    expectedProps.forEach(prop => {
      expect(firstItem).toHaveProperty(prop);
    });
  }
}

/**
 * Expects the hook result to have an error
 */
export function expectHookHasError(
  result: RenderHookResult<UseLiquidViewResult, unknown>['result']
) {
  expect(result.current.error).not.toBeNull();
  expect(result.current.data).toEqual({});
}

/**
 * Expects the hook result to have no error
 */
export function expectHookHasNoError(
  result: RenderHookResult<UseLiquidViewResult, unknown>['result']
) {
  expect(result.current.error).toBeNull();
}
