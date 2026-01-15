import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableComponent } from '../src/components/TableComponent';

describe('TableComponent - Real Implementation', () => {
  it('should render table with TanStack Table', () => {
    const data = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
      { id: 3, name: 'Charlie', email: 'charlie@example.com' },
    ];

    render(
      <TableComponent
        type="table"
        columns={['id', 'name', 'email']}
        data={data}
        index={0}
      />
    );

    // TanStack Tableのtableタグが生成される
    const tableElement = screen.getByRole('table');
    expect(tableElement).toBeInTheDocument();

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

    render(
      <TableComponent
        type="table"
        columns={['id', 'value']}
        title="Sales Data"
        data={data}
        index={0}
      />
    );

    expect(screen.getByText('Sales Data')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    render(
      <TableComponent
        type="table"
        columns={['id', 'name']}
        data={[]}
        index={0}
      />
    );

    expect(screen.getByTestId('liquid-component-table-0')).toBeInTheDocument();
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <TableComponent
        type="table"
        columns={['id', 'name']}
        loading={true}
        index={0}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle dynamic column order', () => {
    const data = [
      { a: 1, b: 2, c: 3 },
      { a: 4, b: 5, c: 6 },
    ];

    render(
      <TableComponent
        type="table"
        columns={['c', 'a', 'b']}
        data={data}
        index={0}
      />
    );

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // カラムの順序確認（c, a, bの順）
    const headers = screen.getAllByRole('columnheader');
    expect(headers[0]).toHaveTextContent('c');
    expect(headers[1]).toHaveTextContent('a');
    expect(headers[2]).toHaveTextContent('b');
  });

  it('should handle missing columns in data', () => {
    const data = [
      { id: 1, name: 'Alice' }, // email列がない
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];

    render(
      <TableComponent
        type="table"
        columns={['id', 'name', 'email']}
        data={data}
        index={0}
      />
    );

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // 欠損データは空文字またはundefinedとして表示される
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should render with minimal required props', () => {
    render(
      <TableComponent
        type="table"
        columns={['col1']}
        index={0}
      />
    );

    expect(screen.getByTestId('liquid-component-table-0')).toBeInTheDocument();
  });
});
