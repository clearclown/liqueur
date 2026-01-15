import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartComponent } from '../src/components/ChartComponent';

describe('ChartComponent - Real Implementation', () => {
  it('should render bar chart with recharts', () => {
    const data = [
      { name: 'Jan', value: 100 },
      { name: 'Feb', value: 200 },
      { name: 'Mar', value: 150 },
    ];

    render(
      <ChartComponent
        type="chart"
        variant="bar"
        title="Sales"
        data={data}
        index={0}
      />
    );

    // rechartsのBarChartコンテナが存在
    const chartContainer = screen.getByTestId('liquid-component-chart-0');
    expect(chartContainer).toBeInTheDocument();

    // タイトル表示確認
    expect(screen.getByText('Sales')).toBeInTheDocument();

    // rechartsの要素確認（SVGが生成される）
    const svgElements = chartContainer.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('should render line chart', () => {
    const data = [
      { date: '2024-01', amount: 500 },
      { date: '2024-02', amount: 750 },
    ];

    render(
      <ChartComponent
        type="chart"
        variant="line"
        data={data}
        index={1}
      />
    );

    const chartContainer = screen.getByTestId('liquid-component-chart-1');
    expect(chartContainer).toBeInTheDocument();

    // LineChartのSVG要素確認
    const svgElements = chartContainer.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('should render pie chart', () => {
    const data = [
      { category: 'Food', value: 300 },
      { category: 'Travel', value: 200 },
      { category: 'Entertainment', value: 100 },
    ];

    render(
      <ChartComponent
        type="chart"
        variant="pie"
        data={data}
        index={2}
      />
    );

    const chartContainer = screen.getByTestId('liquid-component-chart-2');
    expect(chartContainer).toBeInTheDocument();

    // PieChartのSVG要素確認
    const svgElements = chartContainer.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('should handle empty data gracefully', () => {
    render(
      <ChartComponent
        type="chart"
        variant="bar"
        data={[]}
        index={0}
      />
    );

    // 空データでもエラーにならない
    expect(screen.getByTestId('liquid-component-chart-0')).toBeInTheDocument();
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <ChartComponent
        type="chart"
        variant="bar"
        loading={true}
        index={0}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should apply custom dimensions', () => {
    const data = [{ x: 1, y: 2 }];

    const { container } = render(
      <ChartComponent
        type="chart"
        variant="bar"
        data={data}
        width={800}
        height={400}
        index={0}
      />
    );

    const chartElement = container.querySelector('[data-testid="liquid-component-chart-0"]');
    expect(chartElement).toBeInTheDocument();
  });

  it('should handle unsupported chart variant', () => {
    const data = [{ x: 1, y: 2 }];

    render(
      <ChartComponent
        type="chart"
        variant={'scatter' as any}
        data={data}
        index={0}
      />
    );

    expect(screen.getByText(/unsupported chart variant/i)).toBeInTheDocument();
  });
});
