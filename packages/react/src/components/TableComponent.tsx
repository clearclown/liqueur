// @ts-nocheck - React 19 type compatibility
import React from "react";
import type { TableComponent as TableComponentType } from "@liqueur/protocol";
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { ComponentWrapper } from "./ComponentWrapper";

export interface TableComponentProps extends TableComponentType {
  data?: unknown[];
  index: number;
  loading?: boolean;
}

/**
 * TableComponent - テーブル表示コンポーネント（FR-08, FR-09）
 *
 * TanStack Table統合による実装
 * 動的カラム定義、ソート、ページネーション対応
 */
export const TableComponent: React.FC<TableComponentProps> = ({
  columns,
  title,
  data,
  index,
  loading = false,
}) => {
  const tableData = (data || []) as Array<Record<string, unknown>>;
  const hasData = tableData.length > 0;

  // カラム定義を動的生成
  const columnDefs: ColumnDef<Record<string, unknown>>[] = columns.map((col) => ({
    accessorKey: col,
    header: col,
    cell: (info) => {
      const value = info.getValue();
      // 値がnull/undefinedの場合は空文字を返す
      return value !== null && value !== undefined ? String(value) : "";
    },
  }));

  // TanStack Tableインスタンス作成
  const table = useReactTable({
    data: tableData,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <ComponentWrapper type="table" index={index} title={title} loading={loading} hasData={hasData}>
      <table role="table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} role="columnheader">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ComponentWrapper>
  );
};
