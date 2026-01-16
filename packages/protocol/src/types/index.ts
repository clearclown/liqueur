/**
 * Liquid Protocol v1.0 - Type Definitions
 *
 * JSON Schema-based protocol for AI-driven dynamic UI generation
 * with enterprise-grade security and type safety.
 */

/**
 * Protocol version
 * Currently only "1.0" is supported
 */
export type ProtocolVersion = "1.0";

/**
 * Root schema object defining complete UI structure
 */
export interface LiquidViewSchema {
  /** Protocol version */
  version: ProtocolVersion;
  /** UI layout structure */
  layout: Layout;
  /** UI components to render */
  components: Component[];
  /** Data source definitions (can be empty object) */
  data_sources: Record<string, DataSource>;
}

/**
 * Layout types
 */
export type Layout = GridLayout | StackLayout;

/**
 * CSS Grid-based layout
 */
export interface GridLayout {
  type: "grid";
  /** Number of columns (must be >= 1) */
  columns: number;
  /** Grid gap in pixels (default: 16) */
  gap?: number;
}

/**
 * Flexbox-based layout
 */
export interface StackLayout {
  type: "stack";
  /** Stack direction */
  direction: "horizontal" | "vertical";
  /** Item spacing in pixels (default: 8) */
  gap?: number;
}

/**
 * UI Component types
 */
export type Component = ChartComponent | TableComponent;

/**
 * Base component interface
 */
export interface BaseComponent {
  type: string;
  title?: string;
  data_source?: string;
}

/**
 * Chart component (Recharts integration)
 */
export interface ChartComponent extends BaseComponent {
  type: "chart";
  /** Chart variant */
  variant: ChartVariant;
  /** X-axis field name */
  xAxis?: string;
  /** Y-axis field name */
  yAxis?: string;
}

export type ChartVariant = "bar" | "line" | "pie" | "area";

/**
 * Table component
 */
export interface TableComponent extends BaseComponent {
  type: "table";
  /** Column names to display */
  columns: string[];
  /** Enable sorting (default: false) */
  sortable?: boolean;
}

/**
 * Data source definition
 * Converted to ORM queries in backend
 */
export interface DataSource {
  /** Resource name (table/model name) */
  resource: string;
  /** Filter conditions */
  filters?: Filter[];
  /** Aggregation method */
  aggregation?: Aggregation;
  /** Sort condition */
  sort?: Sort;
  /** Result limit */
  limit?: number;
}

/**
 * Filter condition
 */
export interface Filter {
  /** Field name */
  field: string;
  /** Filter operator */
  op: FilterOperator;
  /** Filter value */
  value: string | number | boolean | Array<string | number>;
}

/**
 * Filter operators
 */
export type FilterOperator =
  | "eq" // Equal
  | "neq" // Not equal
  | "gt" // Greater than
  | "gte" // Greater than or equal
  | "lt" // Less than
  | "lte" // Less than or equal
  | "in" // In array
  | "contains"; // Partial match

/**
 * Aggregation method
 */
export interface Aggregation {
  /** Aggregation type */
  type: AggregationType;
  /** Target field for aggregation */
  field: string;
  /** GROUP BY field (optional) */
  by?: string;
}

export type AggregationType = "sum" | "avg" | "count" | "min" | "max";

/**
 * Sort condition
 */
export interface Sort {
  /** Sort field */
  field: string;
  /** Sort direction */
  direction: "asc" | "desc";
}

/**
 * Type guards
 */

export function isLiquidViewSchema(value: unknown): value is LiquidViewSchema {
  if (typeof value !== "object" || value === null) return false;
  const schema = value as any;
  return (
    typeof schema.version === "string" &&
    schema.version === "1.0" &&
    typeof schema.layout === "object" &&
    typeof schema.data_sources === "object"
  );
}

export function isGridLayout(layout: Layout): layout is GridLayout {
  return layout.type === "grid";
}

export function isStackLayout(layout: Layout): layout is StackLayout {
  return layout.type === "stack";
}

export function isChartComponent(component: Component): component is ChartComponent {
  return component.type === "chart";
}

export function isTableComponent(component: Component): component is TableComponent {
  return component.type === "table";
}

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  UNSUPPORTED_VERSION = "UNSUPPORTED_VERSION",
  INVALID_LAYOUT_TYPE = "INVALID_LAYOUT_TYPE",
  INVALID_COMPONENT_TYPE = "INVALID_COMPONENT_TYPE",
  DANGLING_DATA_SOURCE_REF = "DANGLING_DATA_SOURCE_REF",
  MISSING_RESOURCE = "MISSING_RESOURCE",
  INVALID_FILTER_OP = "INVALID_FILTER_OP",
  INVALID_AGGREGATION_TYPE = "INVALID_AGGREGATION_TYPE",
  INVALID_GRID_COLUMNS = "INVALID_GRID_COLUMNS",
  INVALID_CHART_VARIANT = "INVALID_CHART_VARIANT",
  EMPTY_TABLE_COLUMNS = "EMPTY_TABLE_COLUMNS",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_TYPE = "INVALID_TYPE",
  INVALID_FILTER_VALUE_TYPE = "INVALID_FILTER_VALUE_TYPE",
  MISSING_FILTER_FIELD = "MISSING_FILTER_FIELD",
  MISSING_AGGREGATION_FIELD = "MISSING_AGGREGATION_FIELD",
  INVALID_SORT_DIRECTION = "INVALID_SORT_DIRECTION",
  MISSING_SORT_FIELD = "MISSING_SORT_FIELD",
  INVALID_LIMIT = "INVALID_LIMIT",
}

/**
 * Validation error
 */
export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  path?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
