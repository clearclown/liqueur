import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiquidRenderer } from '../src/components/LiquidRenderer';
import type { LiquidViewSchema } from '@liqueur/protocol';

describe('LiquidRenderer (FR-08: UIレンダリング)', () => {
  describe('基本レンダリング', () => {
    it('should render grid layout with 2 columns', () => {
      const schema: LiquidViewSchema = {
        version: '1.0',
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
        data_sources: {},
      };

      render(<LiquidRenderer schema={schema} />);

      // グリッドレイアウトが存在することを確認
      const gridContainer = screen.getByTestId('liquid-grid-layout');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveAttribute('data-columns', '2');
    });

    it('should render stack layout with vertical direction', () => {
      const schema: LiquidViewSchema = {
        version: '1.0',
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
        data_sources: {},
      };

      render(<LiquidRenderer schema={schema} />);

      const stackContainer = screen.getByTestId('liquid-stack-layout');
      expect(stackContainer).toBeInTheDocument();
      expect(stackContainer).toHaveAttribute('data-direction', 'vertical');
    });

    it('should throw error for invalid schema version', () => {
      const invalidSchema = {
        version: '99.0', // unsupported
        layout: { type: 'grid', columns: 1 },
        components: [],
        data_sources: {},
      } as LiquidViewSchema;

      // エラーバウンダリでキャッチされることを期待
      expect(() => {
        render(<LiquidRenderer schema={invalidSchema} />);
      }).toThrow('Unsupported protocol version: 99.0');
    });
  });

  describe('コンポーネントレンダリング', () => {
    it('should render chart component', () => {
      const schema: LiquidViewSchema = {
        version: '1.0',
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
      };

      render(<LiquidRenderer schema={schema} />);

      const chartComponent = screen.getByTestId('liquid-component-chart-0');
      expect(chartComponent).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    it('should render table component', () => {
      const schema: LiquidViewSchema = {
        version: '1.0',
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
      };

      render(<LiquidRenderer schema={schema} />);

      const tableComponent = screen.getByTestId('liquid-component-table-0');
      expect(tableComponent).toBeInTheDocument();
    });

    it('should render multiple components', () => {
      const schema: LiquidViewSchema = {
        version: '1.0',
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
        data_sources: {},
      };

      render(<LiquidRenderer schema={schema} />);

      expect(screen.getByTestId('liquid-component-chart-0')).toBeInTheDocument();
      expect(screen.getByTestId('liquid-component-table-1')).toBeInTheDocument();
      expect(screen.getByTestId('liquid-component-chart-2')).toBeInTheDocument();
    });
  });

  describe('FR-09: ローディング状態', () => {
    it('should show loading state when data is being fetched', () => {
      const schema: LiquidViewSchema = {
        version: '1.0',
        layout: {
          type: 'grid',
          columns: 1,
        },
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
      };

      // loadingプロップを渡してローディング状態をシミュレート
      render(<LiquidRenderer schema={schema} loading={true} />);

      expect(screen.getByTestId('liquid-loading-indicator')).toBeInTheDocument();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render components when loading is complete', () => {
      const schema: LiquidViewSchema = {
        version: '1.0',
        layout: {
          type: 'grid',
          columns: 1,
        },
        components: [
          {
            type: 'chart',
            variant: 'bar',
            title: 'Metrics',
          },
        ],
        data_sources: {},
      };

      render(<LiquidRenderer schema={schema} loading={false} />);

      expect(screen.queryByTestId('liquid-loading-indicator')).not.toBeInTheDocument();
      expect(screen.getByTestId('liquid-component-chart-0')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('should handle empty components array', () => {
      const schema: LiquidViewSchema = {
        version: '1.0',
        layout: {
          type: 'grid',
          columns: 1,
        },
        components: [],
        data_sources: {},
      };

      render(<LiquidRenderer schema={schema} />);

      const gridContainer = screen.getByTestId('liquid-grid-layout');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer.children.length).toBe(0);
    });

    it('should throw error for missing data_source reference', () => {
      const schema: LiquidViewSchema = {
        version: '1.0',
        layout: {
          type: 'grid',
          columns: 1,
        },
        components: [
          {
            type: 'chart',
            variant: 'bar',
            data_source: 'nonexistent_ds',
          },
        ],
        data_sources: {}, // data_sourceが定義されていない
      };

      expect(() => {
        render(<LiquidRenderer schema={schema} />);
      }).toThrow('Data source "nonexistent_ds" not found');
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

      expect(() => {
        render(<LiquidRenderer schema={schema} />);
      }).toThrow('Unsupported layout type: flex');
    });
  });

  describe('型安全性', () => {
    it('should accept valid LiquidViewSchema', () => {
      const schema: LiquidViewSchema = {
        version: '1.0',
        layout: {
          type: 'grid',
          columns: 3,
        },
        components: [],
        data_sources: {},
      };

      // TypeScriptコンパイル時に型エラーが出ないことを確認
      expect(() => render(<LiquidRenderer schema={schema} />)).not.toThrow();
    });
  });
});
