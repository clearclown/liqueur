/**
 * Test Helper Functions for SchemaValidator tests
 * Reduces duplication in validator.test.ts
 */

import type {
  LiquidViewSchema,
  GridLayout,
  StackLayout,
  ChartComponent,
  TableComponent,
  DataSource,
  ValidationResult,
} from "../src/types/index.js";
import type { SchemaValidator } from "../src/validators/schema.js";
import { ValidationErrorCode } from "../src/types/index.js";
import { expect } from "vitest";

/**
 * Creates a base schema with defaults
 */
export function createBaseSchema(overrides: Partial<LiquidViewSchema> = {}): any {
  return {
    version: "1.0",
    layout: { type: "grid", columns: 1 },
    components: [],
    data_sources: {},
    ...overrides,
  };
}

/**
 * Creates a grid layout
 */
export function createGridLayout(columns: number, gap?: number): GridLayout {
  const layout: GridLayout = { type: "grid", columns };
  if (gap !== undefined) {
    layout.gap = gap;
  }
  return layout;
}

/**
 * Creates a stack layout
 */
export function createStackLayout(direction: "horizontal" | "vertical", gap?: number): StackLayout {
  const layout: StackLayout = { type: "stack", direction };
  if (gap !== undefined) {
    layout.gap = gap;
  }
  return layout;
}

/**
 * Creates a chart component
 */
export function createChartComponent(
  variant: ChartComponent["variant"],
  props: Partial<ChartComponent> = {}
): ChartComponent {
  return {
    type: "chart",
    variant,
    ...props,
  };
}

/**
 * Creates a table component
 */
export function createTableComponent(
  columns: string[],
  props: Partial<TableComponent> = {}
): TableComponent {
  return {
    type: "table",
    columns,
    ...props,
  };
}

/**
 * Creates a data source
 */
export function createDataSource(resource: string, options: Partial<DataSource> = {}): DataSource {
  return {
    resource,
    ...options,
  };
}

/**
 * Validates schema and expects it to be valid
 */
export function validateAndExpectValid(validator: SchemaValidator, schema: any): ValidationResult {
  const result = validator.validate(schema);
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
  return result;
}

/**
 * Validates schema and expects it to fail with specific error code
 */
export function validateAndExpectError(
  validator: SchemaValidator,
  schema: any,
  errorCode: ValidationErrorCode
): ValidationResult {
  const result = validator.validate(schema);
  expect(result.valid).toBe(false);
  expect(result.errors).toContainEqual(expect.objectContaining({ code: errorCode }));
  return result;
}
