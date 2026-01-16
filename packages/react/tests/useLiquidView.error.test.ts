import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLiquidView } from '../src/hooks/useLiquidView';
import type { LiquidViewSchema } from '@liqueur/protocol';

describe('useLiquidView - Error Handling', () => {
  it('should set error when resource name is empty', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_invalid: { resource: '' } // 空リソース名
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('empty');
    expect(result.current.data).toEqual({});
  });

  it('should set data to {} when error occurs', async () => {
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_invalid: { resource: '   ' } // 空白のみ
      },
    };

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
        ds_invalid: { resource: '' }
      },
    };

    const { result } = renderHook(() => useLiquidView({ schema }));

    // エラー発生後もloading=false
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).not.toBeNull();
  });
});
