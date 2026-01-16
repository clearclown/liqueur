import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLiquidView } from '../src/hooks/useLiquidView';
import type { LiquidViewSchema } from '@liqueur/protocol';

describe('useLiquidView - Integration with LiquidRenderer', () => {
  it('should provide data compatible with LiquidRenderer', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 2, gap: 16 },
      components: [
        { type: 'chart', variant: 'bar', title: 'Sales', data_source: 'ds_sales' },
        { type: 'table', columns: ['id', 'name', 'email'], title: 'Users', data_source: 'ds_users' },
      ],
      data_sources: {
        ds_sales: { resource: 'sales', limit: 6 },
        ds_users: { resource: 'users', limit: 5 },
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // LiquidRendererが期待するデータ形式
    expect(result.current.data).toEqual(
      expect.objectContaining({
        ds_sales: expect.any(Array),
        ds_users: expect.any(Array),
      })
    );

    // データがRecord<string, unknown[]>の形式
    expect(typeof result.current.data).toBe('object');
    expect(Object.keys(result.current.data)).toHaveLength(2);
    expect(Array.isArray(result.current.data.ds_sales)).toBe(true);
    expect(Array.isArray(result.current.data.ds_users)).toBe(true);

    // limit適用確認
    expect(result.current.data.ds_sales).toHaveLength(6);
    expect(result.current.data.ds_users).toHaveLength(5);
  });

  it('should handle schema with components referencing data_sources', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'stack', direction: 'vertical', gap: 12 },
      components: [
        { type: 'chart', variant: 'line', title: 'Monthly Sales', xAxis: 'month', yAxis: 'amount', data_source: 'ds_sales' },
        { type: 'chart', variant: 'pie', title: 'Expenses by Category', data_source: 'ds_expenses' },
        { type: 'table', columns: ['id', 'name', 'email', 'role'], title: 'User List', data_source: 'ds_users', sortable: true },
      ],
      data_sources: {
        ds_sales: { resource: 'sales' },
        ds_expenses: { resource: 'expenses', limit: 10 },
        ds_users: { resource: 'users' },
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // 全てのdata_sourceが正しく生成されている
    expect(result.current.data.ds_sales).toBeDefined();
    expect(result.current.data.ds_expenses).toBeDefined();
    expect(result.current.data.ds_users).toBeDefined();

    // コンポーネントがdata_sourceを参照できるようにキーがマッチしている
    schema.components.forEach((component) => {
      if (component.data_source) {
        expect(result.current.data[component.data_source]).toBeDefined();
        expect(Array.isArray(result.current.data[component.data_source])).toBe(true);
      }
    });

    // limit適用確認
    expect(result.current.data.ds_expenses).toHaveLength(10);
  });
});
