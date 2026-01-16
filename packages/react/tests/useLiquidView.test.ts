/**
 * useLiquidView Hook Test Suite
 * TDD Red-Green-Refactor Cycle
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLiquidView } from '../src/hooks/useLiquidView';
import type { LiquidViewSchema } from '@liqueur/protocol';
import {
  createTestSchema,
  renderUseLiquidViewHook,
  waitForHookComplete,
  expectHookHasData,
  expectHookHasError,
  expectHookHasNoError,
} from './testHelpersHooks';

// ResizeObserver mock (rechartsテストから継承)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('useLiquidView - Basic Functionality', () => {
  it('should return empty data when data_sources is empty', async () => {
    const schema = createTestSchema({});
    const { result } = renderUseLiquidViewHook(schema);

    await waitForHookComplete(result);

    expect(result.current.data).toEqual({});
    expectHookHasNoError(result);
  });

  it('should set loading=false after data fetch completes', async () => {
    const schema = createTestSchema({});
    const { result } = renderUseLiquidViewHook(schema);

    await waitForHookComplete(result);
  });
});

describe('useLiquidView - Mock Data Generation', () => {
  it('should generate mock data for known resources', async () => {
    const schema = createTestSchema({
      components: [
        { type: 'chart', variant: 'bar', data_source: 'ds_sales' }
      ],
      data_sources: {
        ds_sales: { resource: 'sales' }
      },
    });
    const { result } = renderUseLiquidViewHook(schema);

    await waitForHookComplete(result);

    expectHookHasData(result, 'ds_sales', ['month', 'amount']);
  });

  it('should generate users data for "users" resource', async () => {
    const schema = createTestSchema({
      ds_users: { resource: 'users' }
    });
    const { result } = renderUseLiquidViewHook(schema);

    await waitForHookComplete(result);

    expectHookHasData(result, 'ds_users', ['id', 'name', 'email']);
  });

  it('should generate expenses data for "expenses" resource', async () => {
    const schema = createTestSchema({
      ds_expenses: { resource: 'expenses' }
    });
    const { result } = renderUseLiquidViewHook(schema);

    await waitForHookComplete(result);

    expectHookHasData(result, 'ds_expenses', ['date', 'category', 'amount']);
  });

  it('should use partial matching for resource names', async () => {
    const schema = createTestSchema({
      ds_monthly_sales: { resource: 'monthly_sales' }
    });
    const { result } = renderUseLiquidViewHook(schema);

    await waitForHookComplete(result);

    expectHookHasData(result, 'ds_monthly_sales', ['month', 'amount']);
  });

  it('should use default template for unknown resources', async () => {
    const schema = createTestSchema({
      ds_unknown: { resource: 'unknown_resource' }
    });
    const { result } = renderUseLiquidViewHook(schema);

    await waitForHookComplete(result);

    expectHookHasData(result, 'ds_unknown');
  });
});

describe('useLiquidView - Limit Application', () => {
  it('should apply limit to mock data', async () => {
    const schema = createTestSchema({
      components: [
        { type: 'table', columns: ['month', 'amount'], data_source: 'ds_sales' }
      ],
      data_sources: {
        ds_sales: { resource: 'sales', limit: 3 }
      },
    });
    const { result } = renderUseLiquidViewHook(schema);

    await waitForHookComplete(result);

    expect(result.current.data.ds_sales).toHaveLength(3);
  });

  it('should return full data when limit is undefined', async () => {
    const schema = createTestSchema({
      ds_users: { resource: 'users' }
    });
    const { result } = renderUseLiquidViewHook(schema);

    await waitForHookComplete(result);

    expect(result.current.data.ds_users.length).toBe(10); // Full users data
  });

  it('should handle limit=0 correctly', async () => {
    const schema = createTestSchema({
      ds_sales: { resource: 'sales', limit: 0 }
    });
    const { result } = renderUseLiquidViewHook(schema);

    await waitForHookComplete(result);

    expect(result.current.data.ds_sales).toHaveLength(0);
  });
});

describe('useLiquidView - Error Handling', () => {
  it('should set error when resource name is empty', async () => {
    const schema = createTestSchema({
      ds_invalid: { resource: '' }
    });
    const { result } = renderUseLiquidViewHook(schema);

    await waitForHookComplete(result);

    expectHookHasError(result);
  });

  it('should set loading=false when error occurs', async () => {
    const schema = createTestSchema({
      ds_invalid: { resource: '   ' } // Whitespace-only resource
    });
    const { result } = renderUseLiquidViewHook(schema);

    await waitForHookComplete(result);

    expectHookHasError(result);
  });
});

describe('useLiquidView - Schema Reactivity', () => {
  it('should refetch data when schema changes', async () => {
    const initialSchema = createTestSchema({
      ds_sales: { resource: 'sales' }
    });

    const { result, rerender } = renderHook(
      ({ schema }) => useLiquidView({ schema }),
      { initialProps: { schema: initialSchema } }
    );

    await waitForHookComplete(result);
    const firstData = result.current.data;

    expect(firstData.ds_sales).toBeDefined();

    // スキーマ変更
    const newSchema = createTestSchema({
      ds_users: { resource: 'users' }
    });
    rerender({ schema: newSchema });

    await waitForHookComplete(result);

    expect(result.current.data).not.toEqual(firstData);
    expect(result.current.data.ds_users).toBeDefined();
    expect(result.current.data.ds_sales).toBeUndefined();
  });

  it('should clear previous data when schema changes', async () => {
    const initialSchema = createTestSchema({
      ds_sales: { resource: 'sales' },
      ds_users: { resource: 'users' }
    });

    const { result, rerender } = renderHook(
      ({ schema }) => useLiquidView({ schema }),
      { initialProps: { schema: initialSchema } }
    );

    await waitForHookComplete(result);

    expect(result.current.data.ds_sales).toBeDefined();
    expect(result.current.data.ds_users).toBeDefined();

    // スキーマを空に変更
    const emptySchema = createTestSchema({});
    rerender({ schema: emptySchema });

    await waitForHookComplete(result);

    expect(result.current.data).toEqual({});
  });
});
