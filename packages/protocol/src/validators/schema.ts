/**
 * SchemaValidator - Validates Liquid Protocol schemas
 * Implements strict validation according to Protocol Specification v1.0
 */

import {
  type ValidationResult,
  type ValidationError,
  ValidationErrorCode
} from "../types/index.js";

const SUPPORTED_VERSIONS = ["1.0"] as const;
const VALID_LAYOUT_TYPES = ["grid", "stack"] as const;
const VALID_COMPONENT_TYPES = ["chart", "table"] as const;
const VALID_CHART_VARIANTS = ["bar", "line", "pie", "area"] as const;
const VALID_FILTER_OPERATORS = ["eq", "neq", "gt", "gte", "lt", "lte", "in", "contains"] as const;
const VALID_AGGREGATION_TYPES = ["sum", "avg", "count", "min", "max"] as const;

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
        message: "Schema must be an object"
      });
      return { valid: false, errors };
    }

    const s = schema as any;

    // Validate required fields
    if (!s.version) {
      errors.push({
        code: ValidationErrorCode.MISSING_REQUIRED_FIELD,
        message: "Missing required field: version",
        path: "version"
      });
    }

    if (!s.layout) {
      errors.push({
        code: ValidationErrorCode.MISSING_REQUIRED_FIELD,
        message: "Missing required field: layout",
        path: "layout"
      });
    }

    if (s.data_sources === undefined) {
      errors.push({
        code: ValidationErrorCode.MISSING_REQUIRED_FIELD,
        message: "Missing required field: data_sources",
        path: "data_sources"
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

    // Validate data_sources
    if (s.data_sources) {
      this.validateDataSources(s.data_sources, errors);
    }

    // Cross-reference validation: Check data_source references
    if (s.layout && s.data_sources) {
      this.validateDataSourceReferences(s.layout, s.data_sources, errors);
    }

    return {
      valid: errors.length === 0,
      errors
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
        path: "version"
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
        path: "layout.type"
      });
      return;
    }

    // Validate Grid layout
    if (layout.type === "grid") {
      if (layout.props?.columns !== undefined) {
        if (typeof layout.props.columns !== "number" || layout.props.columns < 1) {
          errors.push({
            code: ValidationErrorCode.INVALID_GRID_COLUMNS,
            message: `Grid columns must be >= 1, got: ${layout.props.columns}`,
            path: "layout.props.columns"
          });
        }
      }
    }

    // Validate children components
    if (Array.isArray(layout.children)) {
      layout.children.forEach((component: any, index: number) => {
        this.validateComponent(component, errors, `layout.children[${index}]`);
      });
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
        path: `${path}.type`
      });
      return;
    }

    // Validate Chart component
    if (component.type === "chart") {
      if (component.variant && !VALID_CHART_VARIANTS.includes(component.variant)) {
        errors.push({
          code: ValidationErrorCode.INVALID_CHART_VARIANT,
          message: `Invalid chart variant: ${component.variant}. Valid variants: ${VALID_CHART_VARIANTS.join(", ")}`,
          path: `${path}.variant`
        });
      }
    }

    // Validate Table component
    if (component.type === "table") {
      if (Array.isArray(component.columns) && component.columns.length === 0) {
        errors.push({
          code: ValidationErrorCode.EMPTY_TABLE_COLUMNS,
          message: "Table columns array cannot be empty",
          path: `${path}.columns`
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
        path: "data_sources"
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
        path: `${path}.resource`
      });
    }

    // Validate filters
    if (ds.filters && Array.isArray(ds.filters)) {
      ds.filters.forEach((filter: any, index: number) => {
        if (filter.op && !VALID_FILTER_OPERATORS.includes(filter.op)) {
          errors.push({
            code: ValidationErrorCode.INVALID_FILTER_OP,
            message: `Invalid filter operator: ${filter.op}. Valid operators: ${VALID_FILTER_OPERATORS.join(", ")}`,
            path: `${path}.filters[${index}].op`
          });
        }
      });
    }

    // Validate aggregation
    if (ds.aggregation) {
      if (ds.aggregation.type && !VALID_AGGREGATION_TYPES.includes(ds.aggregation.type)) {
        errors.push({
          code: ValidationErrorCode.INVALID_AGGREGATION_TYPE,
          message: `Invalid aggregation type: ${ds.aggregation.type}. Valid types: ${VALID_AGGREGATION_TYPES.join(", ")}`,
          path: `${path}.aggregation.type`
        });
      }
    }
  }

  /**
   * Validates that all data_source references in components exist
   */
  private validateDataSourceReferences(layout: any, dataSources: any, errors: ValidationError[]): void {
    if (!Array.isArray(layout.children)) return;

    layout.children.forEach((component: any, index: number) => {
      if (component.data_source) {
        if (!dataSources[component.data_source]) {
          errors.push({
            code: ValidationErrorCode.DANGLING_DATA_SOURCE_REF,
            message: `Component references non-existent data_source: ${component.data_source}`,
            path: `layout.children[${index}].data_source`
          });
        }
      }
    });
  }
}
