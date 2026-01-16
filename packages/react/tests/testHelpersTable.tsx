/**
 * Test Helper Functions for TableComponent Tests
 * Reduces duplication in TableComponent.test.tsx
 */

import React from 'react';
import { render, screen, RenderResult } from '@testing-library/react';
import { TableComponent } from '../src/components/TableComponent';
import { expectLoadingState, expectNoDataState } from './testHelpersCommon';

/**
 * Renders TableComponent with the given props
 */
export function renderTableComponent(
  props: Partial<React.ComponentProps<typeof TableComponent>>
): RenderResult {
  return render(
    <TableComponent
      type="table"
      columns={props.columns || []}
      index={props.index ?? 0}
      {...props}
    />
  );
}

/**
 * Gets the table element by role
 */
export function getTableByRole() {
  return screen.getByRole('table');
}

/**
 * Gets the table element by testId
 */
export function getTableByTestId(index: number = 0) {
  return screen.getByTestId(`liquid-component-table-${index}`);
}

/**
 * Expects table to be rendered in the DOM (by role)
 */
export function expectTableRendered() {
  const table = getTableByRole();
  expect(table).toBeInTheDocument();
  return table;
}

/**
 * Expects table to be rendered in the DOM (by testId)
 */
export function expectTableByTestId(index: number = 0) {
  const table = getTableByTestId(index);
  expect(table).toBeInTheDocument();
  return table;
}

/**
 * Creates test data for table component
 */
export function createTableData(
  rowCount: number = 3,
  schema?: Record<string, 'string' | 'number'>
): unknown[] {
  const defaultSchema = { id: 'number', name: 'string', email: 'string' };
  const actualSchema = schema || defaultSchema;

  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];

  return Array.from({ length: rowCount }, (_, i) => {
    const row: Record<string, unknown> = {};

    Object.entries(actualSchema).forEach(([key, type]) => {
      if (key === 'id') {
        row[key] = i + 1;
      } else if (key === 'name') {
        row[key] = names[i % names.length];
      } else if (key === 'email' && type === 'string') {
        row[key] = `${names[i % names.length].toLowerCase()}@example.com`;
      } else if (type === 'number') {
        row[key] = (i + 1) * 10;
      } else {
        row[key] = `${key}_${i + 1}`;
      }
    });

    return row;
  });
}

/**
 * Expects table headers to match the given column names
 */
export function expectTableHeaders(columnNames: string[]) {
  const headers = screen.getAllByRole('columnheader');

  columnNames.forEach((columnName, index) => {
    expect(headers[index]).toHaveTextContent(columnName);
  });

  return headers;
}

// Re-export common helpers for backward compatibility
export { expectLoadingState, expectNoDataState };
