import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import type { LiquidViewSchema } from '@liqueur/protocol';
import {
  createRendererSchema,
  renderLiquidRenderer,
  expectComponentRendered,
  expectLayoutRendered,
  expectThrowsRenderError,
  expectLoadingIndicator,
  expectNoLoadingIndicator,
} from './testHelpersRenderer';

describe('LiquidRenderer (FR-08: UIレンダリング)', () => {
  describe('基本レンダリング', () => {
    it('should render grid layout with 2 columns', () => {
      const schema = createRendererSchema({
        layout: {
          type: 'grid',
          columns: 2,
          gap: 16,
        },
        components: [
          {
            type: 'chart',
            variant: 'bar',
            title: 'Sales Chart',
          },
        ],
      });

      renderLiquidRenderer(schema);

      expectLayoutRendered('grid', { columns: '2' });
    });

    it('should render stack layout with vertical direction', () => {
      const schema = createRendererSchema({
        layout: {
          type: 'stack',
          direction: 'vertical',
          gap: 8,
        },
        components: [
          {
            type: 'table',
            columns: ['id', 'name'],
          },
        ],
      });

      renderLiquidRenderer(schema);

      expectLayoutRendered('stack', { direction: 'vertical' });
    });

    it('should throw error for invalid schema version', () => {
      const invalidSchema = {
        version: '99.0', // unsupported
        layout: { type: 'grid', columns: 1 },
        components: [],
        data_sources: {},
      } as LiquidViewSchema;

      expectThrowsRenderError(invalidSchema, 'Unsupported protocol version: 99.0');
    });
  });

  describe('コンポーネントレンダリング', () => {
    it('should render chart component', () => {
      const schema = createRendererSchema({
        layout: {
          type: 'grid',
          columns: 1,
        },
        components: [
          {
            type: 'chart',
            variant: 'bar',
            title: 'Revenue',
            data_source: 'ds_revenue',
          },
        ],
        data_sources: {
          ds_revenue: {
            resource: 'sales',
          },
        },
      });

      renderLiquidRenderer(schema);

      expectComponentRendered('chart', 0);
      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    it('should render table component', () => {
      const schema = createRendererSchema({
        layout: {
          type: 'stack',
          direction: 'vertical',
        },
        components: [
          {
            type: 'table',
            columns: ['id', 'name', 'email'],
            data_source: 'ds_users',
          },
        ],
        data_sources: {
          ds_users: {
            resource: 'users',
          },
        },
      });

      renderLiquidRenderer(schema);

      expectComponentRendered('table', 0);
    });

    it('should render multiple components', () => {
      const schema = createRendererSchema({
        layout: {
          type: 'grid',
          columns: 2,
        },
        components: [
          {
            type: 'chart',
            variant: 'line',
            title: 'Trend',
          },
          {
            type: 'table',
            columns: ['date', 'value'],
          },
          {
            type: 'chart',
            variant: 'pie',
            title: 'Distribution',
          },
        ],
      });

      renderLiquidRenderer(schema);

      expectComponentRendered('chart', 0);
      expectComponentRendered('table', 1);
      expectComponentRendered('chart', 2);
    });
  });

  describe('FR-09: ローディング状態', () => {
    it('should show loading state when data is being fetched', () => {
      const schema = createRendererSchema({
        components: [
          {
            type: 'chart',
            variant: 'bar',
            data_source: 'ds_data',
          },
        ],
        data_sources: {
          ds_data: {
            resource: 'metrics',
          },
        },
      });

      renderLiquidRenderer(schema, { loading: true });

      expectLoadingIndicator();
    });

    it('should render components when loading is complete', () => {
      const schema = createRendererSchema({
        components: [
          {
            type: 'chart',
            variant: 'bar',
            title: 'Metrics',
          },
        ],
      });

      renderLiquidRenderer(schema, { loading: false });

      expectNoLoadingIndicator();
      expectComponentRendered('chart', 0);
    });
  });

  describe('エラーハンドリング', () => {
    it('should handle empty components array', () => {
      const schema = createRendererSchema({
        components: [],
      });

      renderLiquidRenderer(schema);

      const gridContainer = expectLayoutRendered('grid');
      expect(gridContainer.children.length).toBe(0);
    });

    it('should throw error for missing data_source reference', () => {
      const schema = createRendererSchema({
        components: [
          {
            type: 'chart',
            variant: 'bar',
            data_source: 'nonexistent_ds',
          },
        ],
        data_sources: {}, // data_sourceが定義されていない
      });

      expectThrowsRenderError(schema, 'Data source "nonexistent_ds" not found');
    });

    it('should throw error for unsupported layout type', () => {
      const schema = {
        version: '1.0',
        layout: {
          type: 'flex', // unsupported layout type
        },
        components: [],
        data_sources: {},
      } as any;

      expectThrowsRenderError(schema, 'Unsupported layout type: flex');
    });
  });

  describe('型安全性', () => {
    it('should accept valid LiquidViewSchema', () => {
      const schema = createRendererSchema({
        layout: {
          type: 'grid',
          columns: 3,
        },
      });

      // TypeScriptコンパイル時に型エラーが出ないことを確認
      expect(() => renderLiquidRenderer(schema)).not.toThrow();
    });
  });
});
