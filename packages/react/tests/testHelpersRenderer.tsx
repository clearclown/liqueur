/**
 * Test Helper Functions for LiquidRenderer Component Tests
 * Reduces duplication in LiquidRenderer.test.tsx
 */

import React from 'react';
import { render, screen, RenderResult } from '@testing-library/react';
import { LiquidRenderer } from '../src/components/LiquidRenderer';
import type { LiquidViewSchema } from '@liqueur/protocol';

/**
 * Creates a base schema for renderer tests with defaults
 */
export function createRendererSchema(overrides: Partial<LiquidViewSchema> = {}): LiquidViewSchema {
  return {
    version: '1.0',
    layout: { type: 'grid', columns: 1 },
    components: [],
    data_sources: {},
    ...overrides,
  } as LiquidViewSchema;
}

/**
 * Renders LiquidRenderer component with the given schema and optional props
 */
export function renderLiquidRenderer(
  schema: LiquidViewSchema,
  props?: Partial<React.ComponentProps<typeof LiquidRenderer>>
): RenderResult {
  return render(<LiquidRenderer schema={schema} {...props} />);
}

/**
 * Expects a component to be rendered with the given type and index
 */
export function expectComponentRendered(type: 'chart' | 'table', index: number) {
  const testId = `liquid-component-${type}-${index}`;
  const component = screen.getByTestId(testId);
  expect(component).toBeInTheDocument();
  return component;
}

/**
 * Expects a layout to be rendered with the given type
 * Optionally checks attributes on the layout container
 */
export function expectLayoutRendered(
  type: 'grid' | 'stack',
  attributes?: Record<string, string>
) {
  const testId = `liquid-${type}-layout`;
  const layout = screen.getByTestId(testId);
  expect(layout).toBeInTheDocument();

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      expect(layout).toHaveAttribute(`data-${key}`, value);
    });
  }

  return layout;
}

/**
 * Expects the renderer to throw an error when rendering the given schema
 */
export function expectThrowsRenderError(
  schema: LiquidViewSchema | any,
  errorMessage: string
) {
  expect(() => {
    render(<LiquidRenderer schema={schema} />);
  }).toThrow(errorMessage);
}

/**
 * Expects loading indicator to be visible
 */
export function expectLoadingIndicator() {
  expect(screen.getByTestId('liquid-loading-indicator')).toBeInTheDocument();
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
}

/**
 * Expects loading indicator to NOT be visible
 */
export function expectNoLoadingIndicator() {
  expect(screen.queryByTestId('liquid-loading-indicator')).not.toBeInTheDocument();
}
