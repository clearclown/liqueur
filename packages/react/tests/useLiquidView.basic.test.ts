import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLiquidView } from '../src/hooks/useLiquidView';
import type { LiquidViewSchema } from '@liqueur/protocol';

describe('useLiquidView - Basic Functionality', () => {
  it('should return empty data when data_sources is empty', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {},
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it('should generate mock data for single data_source', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [
        { type: 'chart', variant: 'bar', data_source: 'ds_sales' }
      ],
      data_sources: {
        ds_sales: { resource: 'sales' }
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_sales).toBeDefined();
    expect(Array.isArray(result.current.data.ds_sales)).toBe(true);
    expect(result.current.data.ds_sales.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('should generate mock data for multiple data_sources', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 2 },
      components: [
        { type: 'chart', variant: 'bar', data_source: 'ds_sales' },
        { type: 'table', columns: ['id', 'name'], data_source: 'ds_users' },
      ],
      data_sources: {
        ds_sales: { resource: 'sales' },
        ds_users: { resource: 'users' },
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_sales).toBeDefined();
    expect(result.current.data.ds_users).toBeDefined();
    expect(Array.isArray(result.current.data.ds_sales)).toBe(true);
    expect(Array.isArray(result.current.data.ds_users)).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should map data_source names to data correctly', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'stack', direction: 'vertical' },
      components: [],
      data_sources: {
        custom_sales: { resource: 'sales' },
        custom_users: { resource: 'users' },
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // データソース名が正しくマッピングされている
    expect(Object.keys(result.current.data)).toEqual(['custom_sales', 'custom_users']);
    expect(result.current.error).toBeNull();
  });

  it('should set loading=false after data is fetched', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_sales: { resource: 'sales' }
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    // データ取得後はloading=false
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_sales).toBeDefined();
    expect(result.current.error).toBeNull();
  });
});
