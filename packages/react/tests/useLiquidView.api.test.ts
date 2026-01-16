import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLiquidView } from '../src/hooks/useLiquidView';
import type { LiquidViewSchema } from '@liqueur/protocol';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useLiquidView - API Integration', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call /api/liquid/query endpoint when useMockData is false', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_sales: { resource: 'sales' },
      },
    };

    // Mock API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { month: 'Jan', amount: 1000 },
          { month: 'Feb', amount: 1500 },
        ],
        metadata: {
          totalCount: 2,
          executionTime: 50,
        },
      }),
    });

    const { result } = renderHook(() =>
      useLiquidView({ schema, useMockData: false })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/liquid/query',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('sales'),
      })
    );

    expect(result.current.data.ds_sales).toEqual([
      { month: 'Jan', amount: 1000 },
      { month: 'Feb', amount: 1500 },
    ]);
    expect(result.current.error).toBeNull();
  });

  it('should use mock data when useMockData is true (default)', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_sales: { resource: 'sales' },
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should NOT call fetch
    expect(mockFetch).not.toHaveBeenCalled();

    // Should have mock data
    expect(result.current.data.ds_sales).toBeDefined();
    expect(result.current.data.ds_sales.length).toBeGreaterThan(0);
  });

  it('should handle API errors gracefully', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_sales: { resource: 'sales' },
      },
    };

    // Mock API error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      useLiquidView({ schema, useMockData: false })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('Network error');
    expect(result.current.data).toEqual({});
  });

  it('should handle HTTP error responses', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_sales: { resource: 'sales' },
      },
    };

    // Mock 401 Unauthorized
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }),
    });

    const { result } = renderHook(() =>
      useLiquidView({ schema, useMockData: false })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('401');
  });

  it('should fetch multiple data sources in sequence', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_sales: { resource: 'sales' },
        ds_users: { resource: 'users' },
      },
    };

    // Mock both API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ month: 'Jan', amount: 1000 }],
          metadata: { totalCount: 1, executionTime: 50 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: 1, name: 'Alice' }],
          metadata: { totalCount: 1, executionTime: 30 },
        }),
      });

    const { result } = renderHook(() =>
      useLiquidView({ schema, useMockData: false })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.current.data.ds_sales).toEqual([{ month: 'Jan', amount: 1000 }]);
    expect(result.current.data.ds_users).toEqual([{ id: 1, name: 'Alice' }]);
  });

  it('should include dataSource in request body', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_expenses: {
          resource: 'expenses',
          filters: [{ field: 'category', op: 'eq', value: 'Food' }],
          limit: 10,
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [],
        metadata: { totalCount: 0, executionTime: 20 },
      }),
    });

    const { result } = renderHook(() =>
      useLiquidView({ schema, useMockData: false })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const callArg = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArg.body);

    expect(body).toEqual({
      dataSource: {
        resource: 'expenses',
        filters: [{ field: 'category', op: 'eq', value: 'Food' }],
        limit: 10,
      },
    });
  });
});
