import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartComponent } from '../src/components/ChartComponent';

describe('ChartComponent (FR-08, FR-09)', () => {
  it('should render chart with title', () => {
    render(
      <ChartComponent
        type="chart"
        variant="bar"
        title="Sales Chart"
        index={0}
      />
    );

    expect(screen.getByText('Sales Chart')).toBeInTheDocument();
  });

  it('should render chart without title', () => {
    render(
      <ChartComponent
        type="chart"
        variant="line"
        index={0}
      />
    );

    const chart = screen.getByTestId('liquid-component-chart-0');
    expect(chart).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should display data count when data is provided', () => {
    const mockData = [{ value: 100 }, { value: 200 }];

    render(
      <ChartComponent
        type="chart"
        variant="pie"
        data={mockData}
        index={1}
      />
    );

    expect(screen.getByText(/2 records/)).toBeInTheDocument();
  });

  it('should display "No data" when data is not provided', () => {
    render(
      <ChartComponent
        type="chart"
        variant="bar"
        index={0}
      />
    );

    expect(screen.getByText(/No data/)).toBeInTheDocument();
  });

  it('should render all chart variants', () => {
    const variants: Array<'bar' | 'line' | 'pie'> = ['bar', 'line', 'pie'];

    variants.forEach((variant, index) => {
      const { container } = render(
        <ChartComponent
          type="chart"
          variant={variant}
          index={index}
        />
      );

      expect(screen.getByText(new RegExp(`Chart \\(${variant}\\)`))).toBeInTheDocument();
    });
  });
});
