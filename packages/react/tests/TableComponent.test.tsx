import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableComponent } from '../src/components/TableComponent';

describe('TableComponent (FR-08, FR-09)', () => {
  it('should render table with columns', () => {
    render(
      <TableComponent
        type="table"
        columns={['id', 'name', 'email']}
        index={0}
      />
    );

    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
  });

  it('should display "No data" when data is not provided', () => {
    render(
      <TableComponent
        type="table"
        columns={['col1', 'col2']}
        index={0}
      />
    );

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('should display row count when data is provided', () => {
    const mockData = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ];

    render(
      <TableComponent
        type="table"
        columns={['id', 'name']}
        data={mockData}
        index={0}
      />
    );

    expect(screen.getByText('3 rows')).toBeInTheDocument();
  });

  it('should handle empty data array', () => {
    render(
      <TableComponent
        type="table"
        columns={['col1']}
        data={[]}
        index={0}
      />
    );

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('should render correct testid with index', () => {
    render(
      <TableComponent
        type="table"
        columns={['col1']}
        index={5}
      />
    );

    expect(screen.getByTestId('liquid-component-table-5')).toBeInTheDocument();
  });
});
