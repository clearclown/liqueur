/**
 * Mock Schema Fixtures
 * Shared test data for API tests
 */

import type { LiquidViewSchema, DatabaseMetadata } from "@liqueur/protocol";

/**
 * Mock LiquidViewSchema for testing
 */
export const mockSchema: LiquidViewSchema = {
  version: "1.0",
  layout: {
    type: "grid",
    columns: 12,
    gap: 16,
  },
  components: [
    {
      type: "chart",
      id: "chart1",
      data_source: "ds1",
      variant: "bar",
      title: "Expenses by Category",
      x_field: "category",
      y_field: "amount",
      grid_area: {
        column: 1,
        row: 1,
        column_span: 6,
        row_span: 4,
      },
    },
  ],
  data_sources: {
    ds1: {
      resource: "expenses",
      filters: [{ field: "category", op: "neq", value: "travel" }],
    },
  },
};

/**
 * Mock DatabaseMetadata for testing
 */
export const mockMetadata: DatabaseMetadata = {
  tables: [
    {
      name: "expenses",
      description: "Expense transactions",
      columns: [
        { name: "id", type: "integer", nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: "user_id", type: "integer", nullable: false, isPrimaryKey: false, isForeignKey: true },
        { name: "category", type: "text", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "amount", type: "decimal", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "date", type: "date", nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
    {
      name: "sales",
      description: "Sales records",
      columns: [
        { name: "id", type: "integer", nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: "product", type: "text", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "quantity", type: "integer", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "revenue", type: "decimal", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "date", type: "date", nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
  ],
};
