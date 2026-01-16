/**
 * Common Test Helper Functions
 * Shared utilities for React component tests to reduce duplication
 */

import { screen } from '@testing-library/react';
import { expect } from 'vitest';

/**
 * Expects loading indicator to be visible
 * Used by ChartComponent and TableComponent tests
 */
export function expectLoadingState() {
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
}

/**
 * Expects "no data" message to be visible
 * Used by ChartComponent and TableComponent tests
 */
export function expectNoDataState() {
  expect(screen.getByText(/no data/i)).toBeInTheDocument();
}
