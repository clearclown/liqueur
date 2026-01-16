/**
 * SchemaValidator Test Suite
 * TDD Red Phase: 15+ test cases covering all validation scenarios
 */

import { describe, it, expect } from "vitest";
import {
  type LiquidViewSchema,
  ValidationErrorCode,
  isLiquidViewSchema,
  isGridLayout,
  isStackLayout,
  isChartComponent,
  isTableComponent
} from "../src/types/index.js";
import { SchemaValidator } from "../src/validators/schema.js";
import {
  createBaseSchema,
  createGridLayout,
  createStackLayout,
  createChartComponent,
  createTableComponent,
  createDataSource,
  validateAndExpectValid,
  validateAndExpectError,
} from "./testHelpers.js";

describe("SchemaValidator", () => {
  const validator = new SchemaValidator();

  /**
   * Test 1: ✅ Valid minimal schema
   */
  it("should validate a minimal valid schema", () => {
    const schema = createBaseSchema({ layout: createGridLayout(2) });

    validateAndExpectValid(validator, schema);
  });

  /**
   * Test 2: ❌ Unsupported version
   */
  it("should reject unsupported protocol version", () => {
    const schema = createBaseSchema({ version: "2.0", layout: createGridLayout(2) });

    validateAndExpectError(validator, schema, ValidationErrorCode.UNSUPPORTED_VERSION);
  });

  /**
   * Test 3: ❌ Invalid layout type
   */
  it("should reject invalid layout type", () => {
    const schema = createBaseSchema({ layout: { type: "invalid_layout" } });

    validateAndExpectError(validator, schema, ValidationErrorCode.INVALID_LAYOUT_TYPE);
  });

  /**
   * Test 4: ❌ Invalid component type
   */
  it("should reject invalid component type", () => {
    const schema = createBaseSchema({ components: [{ type: "invalid_component" }] });

    validateAndExpectError(validator, schema, ValidationErrorCode.INVALID_COMPONENT_TYPE);
  });

  /**
   * Test 5: ❌ Missing required field (version)
   */
  it("should reject schema missing version field", () => {
    const schema = {
      layout: createGridLayout(2),
      components: [],
      data_sources: {}
    };

    validateAndExpectError(validator, schema, ValidationErrorCode.MISSING_REQUIRED_FIELD);
  });

  /**
   * Test 6: ❌ Missing required field (layout)
   */
  it("should reject schema missing layout field", () => {
    const schema = {
      version: "1.0",
      data_sources: {}
    };

    validateAndExpectError(validator, schema, ValidationErrorCode.MISSING_REQUIRED_FIELD);
  });

  /**
   * Test 7: ❌ Missing required field (data_sources)
   */
  it("should reject schema missing data_sources field", () => {
    const schema = {
      version: "1.0",
      layout: createGridLayout(2),
      components: []
    };

    validateAndExpectError(validator, schema, ValidationErrorCode.MISSING_REQUIRED_FIELD);
  });

  /**
   * Test 8: ❌ Invalid grid columns (zero)
   */
  it("should reject grid layout with zero columns", () => {
    const schema = createBaseSchema({ layout: createGridLayout(0) });

    validateAndExpectError(validator, schema, ValidationErrorCode.INVALID_GRID_COLUMNS);
  });

  /**
   * Test 9: ❌ Invalid grid columns (negative)
   */
  it("should reject grid layout with negative columns", () => {
    const schema = createBaseSchema({ layout: createGridLayout(-1) });

    validateAndExpectError(validator, schema, ValidationErrorCode.INVALID_GRID_COLUMNS);
  });

  /**
   * Test 10: ❌ Invalid chart variant
   */
  it("should reject chart component with invalid variant", () => {
    const schema = createBaseSchema({
      components: [
        {
          type: "chart",
          variant: "invalid_variant" as any,
          title: "Test Chart"
        }
      ]
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.INVALID_CHART_VARIANT);
  });

  /**
   * Test 11: ❌ Empty table columns
   */
  it("should reject table component with empty columns array", () => {
    const schema = createBaseSchema({
      components: [createTableComponent([], { title: "Test Table" })]
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.EMPTY_TABLE_COLUMNS);
  });

  /**
   * Test 12: ❌ Dangling data_source reference
   */
  it("should reject component with non-existent data_source reference", () => {
    const schema = createBaseSchema({
      components: [
        createChartComponent("bar", {
          data_source: "non_existent_ds",
          title: "Test Chart"
        })
      ]
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.DANGLING_DATA_SOURCE_REF);
  });

  /**
   * Test 13: ✅ Valid chart with data_source
   */
  it("should validate chart component with valid data_source reference", () => {
    const schema = createBaseSchema({
      components: [
        createChartComponent("bar", {
          data_source: "sales_data",
          xAxis: "month",
          yAxis: "amount",
          title: "Monthly Sales"
        })
      ],
      data_sources: {
        sales_data: createDataSource("sales", {
          filters: [
            { field: "status", op: "eq", value: "completed" }
          ],
          aggregation: {
            type: "sum",
            field: "amount",
            by: "month"
          }
        })
      }
    });

    validateAndExpectValid(validator, schema);
  });

  /**
   * Test 14: ✅ Valid table with columns
   */
  it("should validate table component with columns", () => {
    const schema = createBaseSchema({
      layout: createStackLayout("vertical", 16),
      components: [
        createTableComponent(["name", "price", "quantity"], {
          data_source: "products_data",
          sortable: true,
          title: "Product List"
        })
      ],
      data_sources: {
        products_data: createDataSource("products", {
          sort: { field: "name", direction: "asc" },
          limit: 50
        })
      }
    });

    validateAndExpectValid(validator, schema);
  });

  /**
   * Test 15: ✅ Complex schema with multiple components and data_sources
   */
  it("should validate complex schema with 2+ components and 2+ data_sources", () => {
    const schema = createBaseSchema({
      layout: createGridLayout(2, 24),
      components: [
        createChartComponent("line", {
          data_source: "monthly_revenue",
          xAxis: "month",
          yAxis: "revenue",
          title: "Revenue Trend"
        }),
        createChartComponent("pie", {
          data_source: "category_breakdown",
          title: "Sales by Category"
        }),
        createTableComponent(["product", "sales", "profit"], {
          data_source: "top_products",
          sortable: true,
          title: "Top Products"
        })
      ],
      data_sources: {
        monthly_revenue: createDataSource("orders", {
          filters: [
            { field: "year", op: "eq", value: 2024 }
          ],
          aggregation: {
            type: "sum",
            field: "amount",
            by: "month"
          },
          sort: { field: "month", direction: "asc" }
        }),
        category_breakdown: createDataSource("orders", {
          aggregation: {
            type: "sum",
            field: "amount",
            by: "category"
          }
        }),
        top_products: createDataSource("products", {
          aggregation: {
            type: "sum",
            field: "sales_amount",
            by: "product_id"
          },
          sort: { field: "sales_amount", direction: "desc" },
          limit: 10
        })
      }
    });

    validateAndExpectValid(validator, schema);
  });

  /**
   * Test 16: ❌ Invalid filter operator
   */
  it("should reject data_source with invalid filter operator", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("users", {
          filters: [
            { field: "age", op: "invalid_op" as any, value: 30 }
          ]
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.INVALID_FILTER_OP);
  });

  /**
   * Test 17: ❌ Invalid aggregation type
   */
  it("should reject data_source with invalid aggregation type", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("sales", {
          aggregation: {
            type: "invalid_agg" as any,
            field: "amount"
          }
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.INVALID_AGGREGATION_TYPE);
  });

  /**
   * Test 18: ❌ Missing resource field in data_source
   */
  it("should reject data_source missing resource field", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: {
          filters: [{ field: "id", op: "eq", value: 1 }]
        } as any
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.MISSING_RESOURCE);
  });

  /**
   * Test 19: ✅ Valid stack layout with horizontal direction
   */
  it("should validate stack layout with horizontal direction", () => {
    const schema = createBaseSchema({
      layout: createStackLayout("horizontal"),
      components: [
        createChartComponent("bar", { title: "Chart 1" }),
        createChartComponent("line", { title: "Chart 2" })
      ]
    });

    validateAndExpectValid(validator, schema);
  });

  /**
   * Test 20: ✅ Valid schema with all filter operators
   */
  it("should validate data_source with all valid filter operators", () => {
    const schema = createBaseSchema({
      data_sources: {
        complex_filters: createDataSource("products", {
          filters: [
            { field: "id", op: "eq", value: 1 },
            { field: "status", op: "neq", value: "deleted" },
            { field: "price", op: "gt", value: 100 },
            { field: "price", op: "gte", value: 100 },
            { field: "price", op: "lt", value: 1000 },
            { field: "price", op: "lte", value: 1000 },
            { field: "category", op: "in", value: ["electronics", "books"] },
            { field: "name", op: "contains", value: "laptop" }
          ]
        })
      }
    });

    validateAndExpectValid(validator, schema);
  });

  /**
   * Test 21: ❌ "in" operator with scalar value (should be array)
   */
  it("should reject 'in' operator with non-array value", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("products", {
          filters: [
            { field: "category", op: "in", value: "electronics" as any }
          ]
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.INVALID_FILTER_VALUE_TYPE);
  });

  /**
   * Test 22: ❌ "eq" operator with array value (should be scalar)
   */
  it("should reject 'eq' operator with array value", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("products", {
          filters: [
            { field: "id", op: "eq", value: [1, 2, 3] as any }
          ]
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.INVALID_FILTER_VALUE_TYPE);
  });

  /**
   * Test 23: ❌ Missing filter field
   */
  it("should reject filter missing field property", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("products", {
          filters: [
            { op: "eq", value: 100 } as any
          ]
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.MISSING_FILTER_FIELD);
  });

  /**
   * Test 24: ❌ Missing filter value
   */
  it("should reject filter missing value property", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("products", {
          filters: [
            { field: "price", op: "gt" } as any
          ]
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.MISSING_FILTER_FIELD);
  });

  /**
   * Test 25: ❌ Missing filter op
   */
  it("should reject filter missing op property", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("products", {
          filters: [
            { field: "price", value: 100 } as any
          ]
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.MISSING_FILTER_FIELD);
  });

  /**
   * Test 26: ❌ Missing aggregation type
   */
  it("should reject aggregation missing type field", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("sales", {
          aggregation: {
            field: "amount"
          } as any
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.MISSING_AGGREGATION_FIELD);
  });

  /**
   * Test 27: ❌ Missing aggregation field
   */
  it("should reject aggregation missing field property", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("sales", {
          aggregation: {
            type: "sum"
          } as any
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.MISSING_AGGREGATION_FIELD);
  });

  /**
   * Test 28: ❌ Invalid sort direction
   */
  it("should reject sort with invalid direction", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("products", {
          sort: { field: "price", direction: "invalid" as any }
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.INVALID_SORT_DIRECTION);
  });

  /**
   * Test 29: ❌ Missing sort field
   */
  it("should reject sort missing field property", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("products", {
          sort: { direction: "asc" } as any
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.MISSING_SORT_FIELD);
  });

  /**
   * Test 30: ❌ Missing sort direction
   */
  it("should reject sort missing direction property", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("products", {
          sort: { field: "price" } as any
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.MISSING_SORT_FIELD);
  });

  /**
   * Test 31: ❌ Negative limit
   */
  it("should reject negative limit value", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("products", {
          limit: -10
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.INVALID_LIMIT);
  });

  /**
   * Test 32: ❌ Zero limit
   */
  it("should reject zero limit value", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("products", {
          limit: 0
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.INVALID_LIMIT);
  });

  /**
   * Test 33: ❌ Non-number limit
   */
  it("should reject non-number limit value", () => {
    const schema = createBaseSchema({
      data_sources: {
        test_ds: createDataSource("products", {
          limit: "10" as any
        })
      }
    });

    validateAndExpectError(validator, schema, ValidationErrorCode.INVALID_LIMIT);
  });
});

/**
 * Type Guards Test Suite
 */
describe("Type Guards", () => {
  /**
   * Test isLiquidViewSchema
   */
  it("should identify valid LiquidViewSchema", () => {
    const schema: LiquidViewSchema = {
      version: "1.0",
      layout: { type: "grid", columns: 1 },
      components: [],
      data_sources: {}
    };

    expect(isLiquidViewSchema(schema)).toBe(true);
  });

  it("should reject non-object as LiquidViewSchema", () => {
    expect(isLiquidViewSchema(null)).toBe(false);
    expect(isLiquidViewSchema(undefined)).toBe(false);
    expect(isLiquidViewSchema("string")).toBe(false);
    expect(isLiquidViewSchema(123)).toBe(false);
  });

  it("should reject object missing required fields", () => {
    expect(isLiquidViewSchema({})).toBe(false);
    expect(isLiquidViewSchema({ version: "1.0" })).toBe(false);
  });

  /**
   * Test isGridLayout
   */
  it("should identify GridLayout", () => {
    const layout = { type: "grid" as const, columns: 2 };
    expect(isGridLayout(layout)).toBe(true);
  });

  it("should reject non-GridLayout", () => {
    const layout = { type: "stack" as const, direction: "vertical" as const };
    expect(isGridLayout(layout)).toBe(false);
  });

  /**
   * Test isStackLayout
   */
  it("should identify StackLayout", () => {
    const layout = { type: "stack" as const, direction: "horizontal" as const };
    expect(isStackLayout(layout)).toBe(true);
  });

  it("should reject non-StackLayout", () => {
    const layout = { type: "grid" as const, columns: 2 };
    expect(isStackLayout(layout)).toBe(false);
  });

  /**
   * Test isChartComponent
   */
  it("should identify ChartComponent", () => {
    const component = { type: "chart" as const, variant: "bar" as const };
    expect(isChartComponent(component)).toBe(true);
  });

  it("should reject non-ChartComponent", () => {
    const component = { type: "table" as const, columns: ["col1"] };
    expect(isChartComponent(component)).toBe(false);
  });

  /**
   * Test isTableComponent
   */
  it("should identify TableComponent", () => {
    const component = { type: "table" as const, columns: ["col1", "col2"] };
    expect(isTableComponent(component)).toBe(true);
  });

  it("should reject non-TableComponent", () => {
    const component = { type: "chart" as const, variant: "line" as const };
    expect(isTableComponent(component)).toBe(false);
  });
});
