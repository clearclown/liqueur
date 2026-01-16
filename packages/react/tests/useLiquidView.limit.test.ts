import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLiquidView } from '../src/hooks/useLiquidView';
import type { LiquidViewSchema } from '@liqueur/protocol';

describe('useLiquidView - Limit Application', () => {
  it('should apply limit to sales data', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [
        { type: 'chart', variant: 'bar', data_source: 'ds_sales' }
      ],
      data_sources: {
        ds_sales: { resource: 'sales', limit: 3 }
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_sales).toBeDefined();
    expect(result.current.data.ds_sales).toHaveLength(3);
  });

  it('should apply limit to users data', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [
        { type: 'table', columns: ['id', 'name'], data_source: 'ds_users' }
      ],
      data_sources: {
        ds_users: { resource: 'users', limit: 5 }
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_users).toBeDefined();
    expect(result.current.data.ds_users).toHaveLength(5);
  });

  it('should return full data when limit is undefined', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [
        { type: 'chart', variant: 'line', data_source: 'ds_sales' }
      ],
      data_sources: {
        ds_sales: { resource: 'sales' } // limitなし
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_sales).toBeDefined();
    // salesのデフォルトデータは12件（12ヶ月分）
    expect(result.current.data.ds_sales.length).toBeGreaterThanOrEqual(10);
  });

  it('should handle limit=0 correctly', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [
        { type: 'table', columns: ['id', 'name'], data_source: 'ds_users' }
      ],
      data_sources: {
        ds_users: { resource: 'users', limit: 0 }
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_users).toBeDefined();
    // limit=0の場合は全データを返す（実装の仕様）
    expect(Array.isArray(result.current.data.ds_users)).toBe(true);
    expect(result.current.data.ds_users.length).toBeGreaterThan(0);
  });
});
