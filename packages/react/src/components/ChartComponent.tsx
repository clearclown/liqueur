import React from 'react';
import type { ChartComponent as ChartComponentType } from '@liqueur/protocol';

export interface ChartComponentProps extends ChartComponentType {
  data?: unknown[];
  index: number;
}

/**
 * ChartComponent - チャート表示コンポーネント（FR-08, FR-09）
 *
 * 現在はプレースホルダー実装
 * Phase 2でrecharts統合を実装予定
 */
export const ChartComponent: React.FC<ChartComponentProps> = ({
  variant,
  title,
  data,
  index,
}) => {
  return (
    <div
      data-testid={`liquid-component-chart-${index}`}
      className="liquid-chart-component"
    >
      {title && <h3>{title}</h3>}
      <div className="chart-placeholder">
        Chart ({variant}) - {data ? `${data.length} records` : 'No data'}
      </div>
    </div>
  );
};
