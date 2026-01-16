import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import {
  renderTableComponent,
  expectTableRendered,
  expectTableByTestId,
  createTableData,
  expectTableHeaders,
  expectLoadingState,
  expectNoDataState,
} from './testHelpersTable';

describe('TableComponent - Real Implementation', () => {
  it('should render table with TanStack Table', () => {
    const data = createTableData(3);

    renderTableComponent({
      columns: ['id', 'name', 'email'],
      data,
      index: 0,
    });

    expectTableRendered();

    // ヘッダー行確認
    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();

    // データ行確認
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should render table with title', () => {
    const data = [{ id: 1, value: 100 }];

    renderTableComponent({
      columns: ['id', 'value'],
      title: 'Sales Data',
      data,
      index: 0,
    });

    expect(screen.getByText('Sales Data')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    renderTableComponent({
      columns: ['id', 'name'],
      data: [],
      index: 0,
    });

    expectTableByTestId(0);
    expectNoDataState();
  });

  it('should show loading state', () => {
    renderTableComponent({
      columns: ['id', 'name'],
      loading: true,
      index: 0,
    });

    expectLoadingState();
  });

  it('should handle dynamic column order', () => {
    const data = [
      { a: 1, b: 2, c: 3 },
      { a: 4, b: 5, c: 6 },
    ];

    renderTableComponent({
      columns: ['c', 'a', 'b'],
      data,
      index: 0,
    });

    expectTableRendered();
    expectTableHeaders(['c', 'a', 'b']);
  });

  it('should handle missing columns in data', () => {
    const data = [
      { id: 1, name: 'Alice' }, // email列がない
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];

    renderTableComponent({
      columns: ['id', 'name', 'email'],
      data,
      index: 0,
    });

    expectTableRendered();

    // 欠損データは空文字またはundefinedとして表示される
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should render with minimal required props', () => {
    renderTableComponent({
      columns: ['col1'],
      index: 0,
    });

    expectTableByTestId(0);
  });
});
