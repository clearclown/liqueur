import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLiquidView } from '../src/hooks/useLiquidView';
import type { LiquidViewSchema } from '@liqueur/protocol';

describe('useLiquidView - Schema Reactivity', () => {
  it('should refetch data when schema changes', async () => {
    const initialSchema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_sales: { resource: 'sales' }
      },
    };

    const { result, rerender } = renderHook(
      ({ schema }) => useLiquidView({ schema }),
      {
        initialProps: { schema: initialSchema },
      }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    const firstData = result.current.data;
    expect(firstData.ds_sales).toBeDefined();

    // スキーマ変更
    const newSchema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_users: { resource: 'users' }
      },
    };

    rerender({ schema: newSchema });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).not.toEqual(firstData);
    expect(result.current.data.ds_users).toBeDefined();
    expect(result.current.data.ds_sales).toBeUndefined();
  });

  it('should update data when data_sources change', async () => {
    const initialSchema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_sales: { resource: 'sales', limit: 5 }
      },
    };

    const { result, rerender } = renderHook(
      ({ schema }) => useLiquidView({ schema }),
      {
        initialProps: { schema: initialSchema },
      }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.ds_sales).toHaveLength(5);

    // limitを変更
    const updatedSchema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_sales: { resource: 'sales', limit: 3 }
      },
    };

    rerender({ schema: updatedSchema });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_sales).toHaveLength(3);
  });

  it('should clear previous data when schema changes', async () => {
    const initialSchema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 2 },
      components: [],
      data_sources: {
        ds_sales: { resource: 'sales' },
        ds_users: { resource: 'users' },
      },
    };

    const { result, rerender } = renderHook(
      ({ schema }) => useLiquidView({ schema }),
      {
        initialProps: { schema: initialSchema },
      }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.ds_sales).toBeDefined();
    expect(result.current.data.ds_users).toBeDefined();

    // 単一のdata_sourceに変更
    const updatedSchema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_expenses: { resource: 'expenses' }
      },
    };

    rerender({ schema: updatedSchema });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // 前のデータは消えている
    expect(result.current.data.ds_sales).toBeUndefined();
    expect(result.current.data.ds_users).toBeUndefined();
    // 新しいデータが存在
    expect(result.current.data.ds_expenses).toBeDefined();
  });
});
