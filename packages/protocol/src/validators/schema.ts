/**
 * SchemaValidator - Validates Liquid Protocol schemas
 * Implements strict validation according to Protocol Specification v1.0
 */

import {
  type ValidationResult,
  type ValidationError,
  ValidationErrorCode,
} from "../types/index";

const SUPPORTED_VERSIONS = ["1.0"] as const;
const VALID_LAYOUT_TYPES = ["grid", "stack"] as const;
const VALID_COMPONENT_TYPES = ["chart", "table"] as const;
const VALID_CHART_VARIANTS = ["bar", "line", "pie", "area"] as const;
const VALID_FILTER_OPERATORS = ["eq", "neq", "gt", "gte", "lt", "lte", "in", "contains"] as const;
const VALID_AGGREGATION_TYPES = ["sum", "avg", "count", "min", "max"] as const;
const VALID_SORT_DIRECTIONS = ["asc", "desc"] as const;

export class SchemaValidator {
  /**
   * Validates a Liquid Protocol schema
   * @param schema - Schema object to validate
   * @returns Validation result with errors if invalid
   */
  validate(schema: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    // Type guard: Check if schema is an object
    if (typeof schema !== "object" || schema === null) {
      errors.push({
        code: ValidationErrorCode.INVALID_TYPE,
        message: "Schema must be an object",
      });
      return { valid: false, errors };
    }

    const s = schema as any;

    // Validate required fields
    if (!s.version) {
      errors.push({
        code: ValidationErrorCode.MISSING_REQUIRED_FIELD,
        message: "Missing required field: version",
        path: "version",
      });
    }

    if (!s.layout) {
      errors.push({
        code: ValidationErrorCode.MISSING_REQUIRED_FIELD,
        message: "Missing required field: layout",
        path: "layout",
      });
    }

    if (!Array.isArray(s.components)) {
      errors.push({
        code: ValidationErrorCode.MISSING_REQUIRED_FIELD,
        message: "Missing required field: components (must be an array)",
        path: "components",
      });
    }

    if (s.data_sources === undefined) {
      errors.push({
        code: ValidationErrorCode.MISSING_REQUIRED_FIELD,
        message: "Missing required field: data_sources",
        path: "data_sources",
      });
    }

    // If critical fields are missing, return early
    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Validate version
    this.validateVersion(s.version, errors);

    // Validate layout
    if (s.layout) {
      this.validateLayout(s.layout, errors);
    }

    // Validate components
    if (Array.isArray(s.components)) {
      s.components.forEach((component: any, index: number) => {
        this.validateComponent(component, errors, `components[${index}]`);
      });
    }

    // Validate data_sources
    if (s.data_sources) {
      this.validateDataSources(s.data_sources, errors);
    }

    // Cross-reference validation: Check data_source references
    if (s.components && s.data_sources) {
      this.validateDataSourceReferences(s.components, s.data_sources, errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates protocol version
   */
  private validateVersion(version: any, errors: ValidationError[]): void {
    if (!SUPPORTED_VERSIONS.includes(version)) {
      errors.push({
        code: ValidationErrorCode.UNSUPPORTED_VERSION,
        message: `Unsupported protocol version: ${version}. Supported versions: ${SUPPORTED_VERSIONS.join(", ")}`,
        path: "version",
      });
    }
  }

  /**
   * Validates layout structure
   */
  private validateLayout(layout: any, errors: ValidationError[]): void {
    if (!layout.type || !VALID_LAYOUT_TYPES.includes(layout.type)) {
      errors.push({
        code: ValidationErrorCode.INVALID_LAYOUT_TYPE,
        message: `Invalid layout type: ${layout.type}. Valid types: ${VALID_LAYOUT_TYPES.join(", ")}`,
        path: "layout.type",
      });
      return;
    }

    // Validate Grid layout
    if (layout.type === "grid") {
      if (layout.columns !== undefined) {
        if (typeof layout.columns !== "number" || layout.columns < 1) {
          errors.push({
            code: ValidationErrorCode.INVALID_GRID_COLUMNS,
            message: `Grid columns must be >= 1, got: ${layout.columns}`,
            path: "layout.columns",
          });
        }
      }
    }
  }

  /**
   * Validates a single component
   */
  private validateComponent(component: any, errors: ValidationError[], path: string): void {
    if (!component.type || !VALID_COMPONENT_TYPES.includes(component.type)) {
      errors.push({
        code: ValidationErrorCode.INVALID_COMPONENT_TYPE,
        message: `Invalid component type: ${component.type}. Valid types: ${VALID_COMPONENT_TYPES.join(", ")}`,
        path: `${path}.type`,
      });
      return;
    }

    // Validate Chart component
    if (component.type === "chart") {
      if (component.variant && !VALID_CHART_VARIANTS.includes(component.variant)) {
        errors.push({
          code: ValidationErrorCode.INVALID_CHART_VARIANT,
          message: `Invalid chart variant: ${component.variant}. Valid variants: ${VALID_CHART_VARIANTS.join(", ")}`,
          path: `${path}.variant`,
        });
      }
    }

    // Validate Table component
    if (component.type === "table") {
      if (Array.isArray(component.columns) && component.columns.length === 0) {
        errors.push({
          code: ValidationErrorCode.EMPTY_TABLE_COLUMNS,
          message: "Table columns array cannot be empty",
          path: `${path}.columns`,
        });
      }
    }
  }

  /**
   * Validates data_sources object
   */
  private validateDataSources(dataSources: any, errors: ValidationError[]): void {
    if (typeof dataSources !== "object") {
      errors.push({
        code: ValidationErrorCode.INVALID_TYPE,
        message: "data_sources must be an object",
        path: "data_sources",
      });
      return;
    }

    Object.entries(dataSources).forEach(([key, ds]) => {
      this.validateDataSource(ds as any, errors, `data_sources.${key}`);
    });
  }

  /**
   * Validates a single DataSource
   */
  private validateDataSource(ds: any, errors: ValidationError[], path: string): void {
    // Validate required resource field
    if (!ds.resource) {
      errors.push({
        code: ValidationErrorCode.MISSING_RESOURCE,
        message: "DataSource must have a resource field",
        path: `${path}.resource`,
      });
    }

    // Validate filters
    if (ds.filters && Array.isArray(ds.filters)) {
      ds.filters.forEach((filter: any, index: number) => {
        this.validateFilter(filter, errors, `${path}.filters[${index}]`);
      });
    }

    // Validate aggregation
    if (ds.aggregation) {
      this.validateAggregation(ds.aggregation, errors, `${path}.aggregation`);
    }

    // Validate sort
    if (ds.sort) {
      this.validateSort(ds.sort, errors, `${path}.sort`);
    }

    // Validate limit
    if (ds.limit !== undefined) {
      this.validateLimit(ds.limit, errors, `${path}.limit`);
    }
  }

  /**
   * Validates a single Filter
   */
  private validateFilter(filter: any, errors: ValidationError[], path: string): void {
    // Validate required fields
    if (!filter.field) {
      errors.push({
        code: ValidationErrorCode.MISSING_FILTER_FIELD,
        message: "Filter must have a field property",
        path: `${path}.field`,
      });
    }

    if (!filter.op) {
      errors.push({
        code: ValidationErrorCode.MISSING_FILTER_FIELD,
        message: "Filter must have an op property",
        path: `${path}.op`,
      });
    }

    if (filter.value === undefined) {
      errors.push({
        code: ValidationErrorCode.MISSING_FILTER_FIELD,
        message: "Filter must have a value property",
        path: `${path}.value`,
      });
    }

    // Validate operator
    if (filter.op && !VALID_FILTER_OPERATORS.includes(filter.op)) {
      errors.push({
        code: ValidationErrorCode.INVALID_FILTER_OP,
        message: `Invalid filter operator: ${filter.op}. Valid operators: ${VALID_FILTER_OPERATORS.join(", ")}`,
        path: `${path}.op`,
      });
      return;
    }

    // Validate value type based on operator
    if (filter.op && filter.value !== undefined) {
      const isArray = Array.isArray(filter.value);

      if (filter.op === "in") {
        // "in" operator requires array value
        if (!isArray) {
          errors.push({
            code: ValidationErrorCode.INVALID_FILTER_VALUE_TYPE,
            message: `Filter operator "in" requires an array value`,
            path: `${path}.value`,
          });
        }
      } else {
        // Other operators require scalar value (string | number | boolean)
        if (isArray) {
          errors.push({
            code: ValidationErrorCode.INVALID_FILTER_VALUE_TYPE,
            message: `Filter operator "${filter.op}" requires a scalar value (string | number | boolean)`,
            path: `${path}.value`,
          });
        }
      }
    }
  }

  /**
   * Validates Aggregation
   */
  private validateAggregation(aggregation: any, errors: ValidationError[], path: string): void {
    // Validate required type field
    if (!aggregation.type) {
      errors.push({
        code: ValidationErrorCode.MISSING_AGGREGATION_FIELD,
        message: "Aggregation must have a type field",
        path: `${path}.type`,
      });
    }

    // Validate required field property
    if (!aggregation.field) {
      errors.push({
        code: ValidationErrorCode.MISSING_AGGREGATION_FIELD,
        message: "Aggregation must have a field property",
        path: `${path}.field`,
      });
    }

    // Validate aggregation type
    if (aggregation.type && !VALID_AGGREGATION_TYPES.includes(aggregation.type)) {
      errors.push({
        code: ValidationErrorCode.INVALID_AGGREGATION_TYPE,
        message: `Invalid aggregation type: ${aggregation.type}. Valid types: ${VALID_AGGREGATION_TYPES.join(", ")}`,
        path: `${path}.type`,
      });
    }
  }

  /**
   * Validates Sort
   */
  private validateSort(sort: any, errors: ValidationError[], path: string): void {
    // Validate required field property
    if (!sort.field) {
      errors.push({
        code: ValidationErrorCode.MISSING_SORT_FIELD,
        message: "Sort must have a field property",
        path: `${path}.field`,
      });
    }

    // Validate required direction property
    if (!sort.direction) {
      errors.push({
        code: ValidationErrorCode.MISSING_SORT_FIELD,
        message: "Sort must have a direction property",
        path: `${path}.direction`,
      });
    }

    // Validate direction value
    if (sort.direction && !VALID_SORT_DIRECTIONS.includes(sort.direction)) {
      errors.push({
        code: ValidationErrorCode.INVALID_SORT_DIRECTION,
        message: `Invalid sort direction: ${sort.direction}. Valid values: ${VALID_SORT_DIRECTIONS.join(", ")}`,
        path: `${path}.direction`,
      });
    }
  }

  /**
   * Validates Limit
   */
  private validateLimit(limit: any, errors: ValidationError[], path: string): void {
    // Validate type
    if (typeof limit !== "number") {
      errors.push({
        code: ValidationErrorCode.INVALID_LIMIT,
        message: `Limit must be a number, got: ${typeof limit}`,
        path,
      });
      return;
    }

    // Validate range
    if (limit <= 0) {
      errors.push({
        code: ValidationErrorCode.INVALID_LIMIT,
        message: `Limit must be a positive integer, got: ${limit}`,
        path,
      });
    }
  }

  /**
   * Validates that all data_source references in components exist
   */
  private validateDataSourceReferences(
    components: any[],
    dataSources: any,
    errors: ValidationError[]
  ): void {
    if (!Array.isArray(components)) return;

    components.forEach((component: any, index: number) => {
      if (component.data_source) {
        if (!dataSources[component.data_source]) {
          errors.push({
            code: ValidationErrorCode.DANGLING_DATA_SOURCE_REF,
            message: `Component references non-existent data_source: ${component.data_source}`,
            path: `components[${index}].data_source`,
          });
        }
      }
    });
  }
}
