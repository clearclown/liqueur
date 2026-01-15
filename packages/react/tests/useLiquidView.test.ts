/**
 * useLiquidView Hook Test Suite
 * TDD Red-Green-Refactor Cycle
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLiquidView } from '../src/hooks/useLiquidView';
import type { LiquidViewSchema } from '@liqueur/protocol';

// ResizeObserver mock (rechartsテストから継承)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('useLiquidView - Basic Functionality', () => {
  it('should return empty data when data_sources is empty', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {},
    } as LiquidViewSchema;

    const { result } = renderHook(() => useLiquidView({ schema }));

    // 初期状態を確認（loading=trueはuseEffectが即座に実行されるため確認困難）
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it('should set loading=false after data fetch completes', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {},
    } as LiquidViewSchema;

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe('useLiquidView - Mock Data Generation', () => {
  it('should generate mock data for known resources', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [
        { type: 'chart', variant: 'bar', data_source: 'ds_sales' }
      ],
      data_sources: {
        ds_sales: { resource: 'sales' }
      },
    } as LiquidViewSchema;

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_sales).toBeDefined();
    expect(result.current.data.ds_sales.length).toBeGreaterThan(0);
    expect(result.current.data.ds_sales[0]).toHaveProperty('month');
    expect(result.current.data.ds_sales[0]).toHaveProperty('amount');
  });

  it('should generate users data for "users" resource', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_users: { resource: 'users' }
      },
    } as LiquidViewSchema;

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_users).toBeDefined();
    expect(result.current.data.ds_users.length).toBeGreaterThan(0);
    expect(result.current.data.ds_users[0]).toHaveProperty('id');
    expect(result.current.data.ds_users[0]).toHaveProperty('name');
    expect(result.current.data.ds_users[0]).toHaveProperty('email');
  });

  it('should generate expenses data for "expenses" resource', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_expenses: { resource: 'expenses' }
      },
    } as LiquidViewSchema;

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_expenses).toBeDefined();
    expect(result.current.data.ds_expenses.length).toBeGreaterThan(0);
    expect(result.current.data.ds_expenses[0]).toHaveProperty('date');
    expect(result.current.data.ds_expenses[0]).toHaveProperty('category');
    expect(result.current.data.ds_expenses[0]).toHaveProperty('amount');
  });

  it('should use partial matching for resource names', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_monthly_sales: { resource: 'monthly_sales' }
      },
    } as LiquidViewSchema;

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_monthly_sales).toBeDefined();
    expect(result.current.data.ds_monthly_sales[0]).toHaveProperty('month');
    expect(result.current.data.ds_monthly_sales[0]).toHaveProperty('amount');
  });

  it('should use default template for unknown resources', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_unknown: { resource: 'unknown_resource' }
      },
    } as LiquidViewSchema;

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_unknown).toBeDefined();
    expect(result.current.data.ds_unknown.length).toBeGreaterThan(0);
  });
});

describe('useLiquidView - Limit Application', () => {
  it('should apply limit to mock data', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [
        { type: 'table', columns: ['month', 'amount'], data_source: 'ds_sales' }
      ],
      data_sources: {
        ds_sales: { resource: 'sales', limit: 3 }
      },
    } as LiquidViewSchema;

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_sales).toHaveLength(3);
  });

  it('should return full data when limit is undefined', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_users: { resource: 'users' }
      },
    } as LiquidViewSchema;

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_users.length).toBe(10); // Full users data
  });

  it('should handle limit=0 correctly', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_sales: { resource: 'sales', limit: 0 }
      },
    } as LiquidViewSchema;

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_sales).toHaveLength(0);
  });
});

describe('useLiquidView - Error Handling', () => {
  it('should set error when resource name is empty', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_invalid: { resource: '' }
      },
    } as LiquidViewSchema;

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toEqual({});
  });

  it('should set loading=false when error occurs', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_invalid: { resource: '   ' } // Whitespace-only resource
      },
    } as LiquidViewSchema;

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).not.toBeNull();
  });
});

describe('useLiquidView - Schema Reactivity', () => {
  it('should refetch data when schema changes', async () => {
    const { result, rerender } = renderHook(
      ({ schema }) => useLiquidView({ schema }),
      {
        initialProps: {
          schema: {
            version: '1.0' as const,
            layout: { type: 'grid' as const, columns: 1 },
            components: [],
            data_sources: { ds_sales: { resource: 'sales' } },
          } as LiquidViewSchema,
        },
      }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    const firstData = result.current.data;

    expect(firstData.ds_sales).toBeDefined();

    // スキーマ変更
    rerender({
      schema: {
        version: '1.0' as const,
        layout: { type: 'grid' as const, columns: 1 },
        components: [],
        data_sources: { ds_users: { resource: 'users' } },
      } as LiquidViewSchema,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).not.toEqual(firstData);
    expect(result.current.data.ds_users).toBeDefined();
    expect(result.current.data.ds_sales).toBeUndefined();
  });

  it('should clear previous data when schema changes', async () => {
    const { result, rerender } = renderHook(
      ({ schema }) => useLiquidView({ schema }),
      {
        initialProps: {
          schema: {
            version: '1.0' as const,
            layout: { type: 'grid' as const, columns: 1 },
            components: [],
            data_sources: { ds_sales: { resource: 'sales' }, ds_users: { resource: 'users' } },
          } as LiquidViewSchema,
        },
      }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_sales).toBeDefined();
    expect(result.current.data.ds_users).toBeDefined();

    // スキーマを空に変更
    rerender({
      schema: {
        version: '1.0' as const,
        layout: { type: 'grid' as const, columns: 1 },
        components: [],
        data_sources: {},
      } as LiquidViewSchema,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({});
  });
});
