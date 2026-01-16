/**
 * Test Helper Functions for ChartComponent Tests
 * Reduces duplication in ChartComponent.test.tsx
 */

import React from 'react';
import { render, screen, RenderResult } from '@testing-library/react';
import { ChartComponent } from '../src/components/ChartComponent';

/**
 * Renders ChartComponent with the given props
 */
export function renderChartComponent(
  props: Partial<React.ComponentProps<typeof ChartComponent>>
): RenderResult {
  return render(
    <ChartComponent
      type="chart"
      variant={props.variant || 'bar'}
      index={props.index ?? 0}
      {...props}
    />
  );
}

/**
 * Gets the chart container element from the DOM
 */
export function getChartContainer(index: number = 0) {
  return screen.getByTestId(`liquid-component-chart-${index}`);
}

/**
 * Expects chart to be rendered in the DOM
 */
export function expectChartRendered(index: number = 0) {
  const chart = getChartContainer(index);
  expect(chart).toBeInTheDocument();
  return chart;
}

/**
 * Expects chart to have SVG elements (recharts rendered)
 */
export function expectChartHasSvg(index: number = 0) {
  const chartContainer = getChartContainer(index);
  const svgElements = chartContainer.querySelectorAll('svg');
  expect(svgElements.length).toBeGreaterThan(0);
  return chartContainer;
}

/**
 * Creates test data for different chart variants
 */
export function createChartData(variant: 'bar' | 'line' | 'pie', count: number = 3): unknown[] {
  switch (variant) {
    case 'bar':
      return Array.from({ length: count }, (_, i) => ({
        name: ['Jan', 'Feb', 'Mar', 'Apr', 'May'][i] || `Month ${i + 1}`,
        value: (i + 1) * 50 + Math.floor(Math.random() * 50),
      }));
    case 'line':
      return Array.from({ length: count }, (_, i) => ({
        date: `2024-0${i + 1}`,
        amount: (i + 1) * 250 + Math.floor(Math.random() * 100),
      }));
    case 'pie':
      return [
        { category: 'Food', value: 300 },
        { category: 'Travel', value: 200 },
        { category: 'Entertainment', value: 100 },
      ].slice(0, count);
    default:
      return [];
  }
}

/**
 * Expects loading indicator to be visible
 */
export function expectLoadingState() {
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
}

/**
 * Expects "no data" message to be visible
 */
export function expectNoDataState() {
  expect(screen.getByText(/no data/i)).toBeInTheDocument();
}
