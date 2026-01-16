/**
 * Protocol Constants
 * Shared constants used across the Liquid Protocol implementation
 */

/**
 * Supported protocol versions
 */
export const SUPPORTED_VERSIONS = ["1.0"] as const;

/**
 * Valid filter operators for DataSource queries
 */
export const VALID_FILTER_OPERATORS = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "contains",
] as const;

/**
 * Valid aggregation types for DataSource queries
 */
export const VALID_AGGREGATION_TYPES = ["sum", "avg", "count", "min", "max"] as const;

/**
 * Valid sort directions
 */
export const VALID_SORT_DIRECTIONS = ["asc", "desc"] as const;

/**
 * Valid chart variants
 */
export const VALID_CHART_VARIANTS = ["line", "bar", "pie", "area"] as const;

/**
 * Valid layout types
 */
export const VALID_LAYOUT_TYPES = ["grid", "stack", "flex"] as const;

/**
 * Valid component types
 */
export const VALID_COMPONENT_TYPES = ["chart", "table"] as const;

// Type definitions are exported from ./types/index.ts to avoid duplication
