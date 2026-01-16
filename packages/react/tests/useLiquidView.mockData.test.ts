import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLiquidView } from '../src/hooks/useLiquidView';
import type { LiquidViewSchema } from '@liqueur/protocol';

describe('useLiquidView - Mock Data Generation', () => {
  it('should generate sales data for "sales" resource', async () => {
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
    expect(result.current.data.ds_sales.length).toBeGreaterThan(0);

    // salesデータの構造を確認
    const firstItem = result.current.data.ds_sales[0] as any;
    expect(firstItem).toHaveProperty('month');
    expect(firstItem).toHaveProperty('amount');
    expect(typeof firstItem.month).toBe('string');
    expect(typeof firstItem.amount).toBe('number');
  });

  it('should generate users data for "users" resource', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [
        { type: 'table', columns: ['id', 'name', 'email'], data_source: 'ds_users' }
      ],
      data_sources: {
        ds_users: { resource: 'users' }
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_users).toBeDefined();
    expect(result.current.data.ds_users.length).toBeGreaterThan(0);

    // usersデータの構造を確認
    const firstItem = result.current.data.ds_users[0] as any;
    expect(firstItem).toHaveProperty('id');
    expect(firstItem).toHaveProperty('name');
    expect(firstItem).toHaveProperty('email');
    expect(typeof firstItem.id).toBe('number');
    expect(typeof firstItem.name).toBe('string');
    expect(typeof firstItem.email).toBe('string');
  });

  it('should generate expenses data for "expenses" resource', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [
        { type: 'table', columns: ['date', 'category', 'amount'], data_source: 'ds_expenses' }
      ],
      data_sources: {
        ds_expenses: { resource: 'expenses' }
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_expenses).toBeDefined();
    expect(result.current.data.ds_expenses.length).toBeGreaterThan(0);

    // expensesデータの構造を確認
    const firstItem = result.current.data.ds_expenses[0] as any;
    expect(firstItem).toHaveProperty('date');
    expect(firstItem).toHaveProperty('category');
    expect(firstItem).toHaveProperty('amount');
    expect(typeof firstItem.date).toBe('string');
    expect(typeof firstItem.category).toBe('string');
    expect(typeof firstItem.amount).toBe('number');
  });

  it('should use partial matching for resource names', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [
        { type: 'chart', variant: 'line', data_source: 'ds_monthly_sales' }
      ],
      data_sources: {
        ds_monthly_sales: { resource: 'monthly_sales' } // "sales"を含む
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_monthly_sales).toBeDefined();
    expect(result.current.data.ds_monthly_sales.length).toBeGreaterThan(0);

    // salesテンプレートが使われていることを確認
    const firstItem = result.current.data.ds_monthly_sales[0] as any;
    expect(firstItem).toHaveProperty('month');
    expect(firstItem).toHaveProperty('amount');
  });

  it('should use default template for unknown resources', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [
        { type: 'table', columns: ['id', 'name'], data_source: 'ds_unknown' }
      ],
      data_sources: {
        ds_unknown: { resource: 'unknown_resource_xyz' }
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.ds_unknown).toBeDefined();
    expect(result.current.data.ds_unknown.length).toBeGreaterThan(0);

    // デフォルトテンプレートの構造を確認
    const firstItem = result.current.data.ds_unknown[0] as any;
    expect(firstItem).toHaveProperty('id');
    expect(firstItem).toHaveProperty('name');
    expect(firstItem).toHaveProperty('value');
  });
});
