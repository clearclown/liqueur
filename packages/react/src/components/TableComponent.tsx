import React from 'react';
import type { TableComponent as TableComponentType } from '@liqueur/protocol';

export interface TableComponentProps extends TableComponentType {
  data?: unknown[];
  index: number;
}

/**
 * TableComponent - テーブル表示コンポーネント（FR-08, FR-09）
 *
 * 現在はプレースホルダー実装
 * Phase 2でソート・ページネーション機能を追加予定
 */
export const TableComponent: React.FC<TableComponentProps> = ({
  columns,
  data,
  index,
}) => {
  return (
    <div
      data-testid={`liquid-component-table-${index}`}
      className="liquid-table-component"
    >
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            <tr>
              <td colSpan={columns.length}>
                {data.length} rows
              </td>
            </tr>
          ) : (
            <tr>
              <td colSpan={columns.length}>No data</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
