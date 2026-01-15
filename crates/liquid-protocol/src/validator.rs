//! Schema Validator
//!
//! Implements strict validation according to Protocol Specification v1.0

use crate::schema::*;
use thiserror::Error;

/// Validation error types
#[derive(Debug, Error, PartialEq)]
pub enum ValidationError {
    #[error("Unsupported protocol version: {0}. Supported versions: 1.0")]
    UnsupportedVersion(String),

    #[error("Invalid layout type at {path}")]
    InvalidLayoutType { path: String },

    #[error("Invalid component type at {path}")]
    InvalidComponentType { path: String },

    #[error("Component references non-existent data_source: {data_source} at {path}")]
    DanglingDataSourceRef { data_source: String, path: String },

    #[error("DataSource must have a resource field at {path}")]
    MissingResource { path: String },

    #[error("Invalid filter operator at {path}")]
    InvalidFilterOp { path: String },

    #[error("Invalid aggregation type at {path}")]
    InvalidAggregationType { path: String },

    #[error("Grid columns must be >= 1, got: {value} at {path}")]
    InvalidGridColumns { value: u32, path: String },

    #[error("Invalid chart variant at {path}")]
    InvalidChartVariant { path: String },

    #[error("Table columns array cannot be empty at {path}")]
    EmptyTableColumns { path: String },

    #[error("Missing required field: {field} at {path}")]
    MissingRequiredField { field: String, path: String },

    #[error("Invalid type at {path}: {message}")]
    InvalidType { path: String, message: String },

    #[error("Filter operator 'in' requires an array value at {path}")]
    InvalidFilterValueType { path: String },

    #[error("Filter must have a {field} property at {path}")]
    MissingFilterField { field: String, path: String },

    #[error("Aggregation must have a {field} field at {path}")]
    MissingAggregationField { field: String, path: String },

    #[error("Invalid sort direction at {path}. Valid values: asc, desc")]
    InvalidSortDirection { path: String },

    #[error("Sort must have a {field} property at {path}")]
    MissingSortField { field: String, path: String },

    #[error("Limit must be a positive integer, got: {value} at {path}")]
    InvalidLimit { value: String, path: String },
}

/// Validation result
#[derive(Debug, PartialEq)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<ValidationError>,
}

impl ValidationResult {
    pub fn ok() -> Self {
        Self {
            valid: true,
            errors: vec![],
        }
    }

    pub fn error(err: ValidationError) -> Self {
        Self {
            valid: false,
            errors: vec![err],
        }
    }

    pub fn errors(errors: Vec<ValidationError>) -> Self {
        Self {
            valid: errors.is_empty(),
            errors,
        }
    }
}

const SUPPORTED_VERSIONS: &[&str] = &["1.0"];

/// Schema validator
pub struct SchemaValidator;

impl SchemaValidator {
    pub fn new() -> Self {
        Self
    }

    /// Validates a Liquid Protocol schema
    pub fn validate(&self, schema: &LiquidViewSchema) -> ValidationResult {
        let mut errors = Vec::new();

        // Validate version
        if !SUPPORTED_VERSIONS.contains(&schema.version.as_str()) {
            errors.push(ValidationError::UnsupportedVersion(schema.version.clone()));
        }

        // Validate layout
        self.validate_layout(&schema.layout, &mut errors);

        // Validate data_sources
        self.validate_data_sources(&schema.data_sources, &mut errors);

        // Cross-reference validation
        self.validate_data_source_references(&schema.layout, &schema.data_sources, &mut errors);

        ValidationResult::errors(errors)
    }

    fn validate_layout(&self, layout: &Layout, errors: &mut Vec<ValidationError>) {
        match layout {
            Layout::Grid { props, children } => {
                // Validate grid columns
                if props.columns < 1 {
                    errors.push(ValidationError::InvalidGridColumns {
                        value: props.columns,
                        path: "layout.props.columns".to_string(),
                    });
                }

                // Validate children
                for (index, component) in children.iter().enumerate() {
                    self.validate_component(
                        component,
                        errors,
                        &format!("layout.children[{}]", index),
                    );
                }
            }
            Layout::Stack { children, .. } => {
                // Validate children
                for (index, component) in children.iter().enumerate() {
                    self.validate_component(
                        component,
                        errors,
                        &format!("layout.children[{}]", index),
                    );
                }
            }
        }
    }

    fn validate_component(
        &self,
        component: &Component,
        errors: &mut Vec<ValidationError>,
        path: &str,
    ) {
        match component {
            Component::Chart { .. } => {
                // Chart validation is handled by enum type system
            }
            Component::Table { columns, .. } => {
                // Validate table columns
                if columns.is_empty() {
                    errors.push(ValidationError::EmptyTableColumns {
                        path: format!("{}.columns", path),
                    });
                }
            }
        }
    }

    fn validate_data_sources(
        &self,
        data_sources: &std::collections::HashMap<String, DataSource>,
        errors: &mut Vec<ValidationError>,
    ) {
        for (key, ds) in data_sources.iter() {
            self.validate_data_source(ds, errors, &format!("data_sources.{}", key));
        }
    }

    fn validate_data_source(
        &self,
        ds: &DataSource,
        errors: &mut Vec<ValidationError>,
        path: &str,
    ) {
        // Resource is always present due to struct definition

        // Validate filters
        if let Some(filters) = &ds.filters {
            for (index, filter) in filters.iter().enumerate() {
                self.validate_filter(filter, errors, &format!("{}.filters[{}]", path, index));
            }
        }

        // Validate aggregation
        if let Some(_aggregation) = &ds.aggregation {
            // Aggregation validation handled by struct
        }

        // Validate sort
        if let Some(_sort) = &ds.sort {
            // Sort validation handled by struct
        }

        // Validate limit (already validated by u32 type)
    }

    fn validate_filter(&self, filter: &Filter, errors: &mut Vec<ValidationError>, path: &str) {
        // Validate value type based on operator
        match filter.op {
            FilterOperator::In => {
                // "in" operator requires array value
                if !matches!(filter.value, FilterValue::Array(_)) {
                    errors.push(ValidationError::InvalidFilterValueType {
                        path: format!("{}.value", path),
                    });
                }
            }
            _ => {
                // Other operators require scalar value
                if matches!(filter.value, FilterValue::Array(_)) {
                    errors.push(ValidationError::InvalidFilterValueType {
                        path: format!("{}.value", path),
                    });
                }
            }
        }
    }

    fn validate_data_source_references(
        &self,
        layout: &Layout,
        data_sources: &std::collections::HashMap<String, DataSource>,
        errors: &mut Vec<ValidationError>,
    ) {
        let children = match layout {
            Layout::Grid { children, .. } => children,
            Layout::Stack { children, .. } => children,
        };

        for (index, component) in children.iter().enumerate() {
            let data_source_ref = match component {
                Component::Chart { data_source, .. } => data_source,
                Component::Table { data_source, .. } => data_source,
            };

            if let Some(ds_ref) = data_source_ref {
                if !data_sources.contains_key(ds_ref) {
                    errors.push(ValidationError::DanglingDataSourceRef {
                        data_source: ds_ref.clone(),
                        path: format!("layout.children[{}].data_source", index),
                    });
                }
            }
        }
    }
}

impl Default for SchemaValidator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_validation_result_ok() {
        let result = ValidationResult::ok();
        assert!(result.valid);
        assert_eq!(result.errors.len(), 0);
    }

    #[test]
    fn test_validation_result_error() {
        let err = ValidationError::UnsupportedVersion("2.0".to_string());
        let result = ValidationResult::error(err);
        assert!(!result.valid);
        assert_eq!(result.errors.len(), 1);
    }

    #[test]
    fn test_validation_result_errors() {
        let errors = vec![
            ValidationError::UnsupportedVersion("2.0".to_string()),
            ValidationError::InvalidGridColumns {
                value: 0,
                path: "test".to_string(),
            },
        ];
        let result = ValidationResult::errors(errors);
        assert!(!result.valid);
        assert_eq!(result.errors.len(), 2);
    }

    #[test]
    fn test_validation_result_errors_empty() {
        let result = ValidationResult::errors(vec![]);
        assert!(result.valid);
        assert_eq!(result.errors.len(), 0);
    }

    #[test]
    fn test_schema_validator_default() {
        let _validator = SchemaValidator::default();
    }

    #[test]
    fn test_error_message_formats() {
        // Test all error variants have proper Display implementation
        let errors = vec![
            ValidationError::UnsupportedVersion("2.0".to_string()),
            ValidationError::InvalidLayoutType {
                path: "layout".to_string(),
            },
            ValidationError::InvalidComponentType {
                path: "component".to_string(),
            },
            ValidationError::DanglingDataSourceRef {
                data_source: "test_ds".to_string(),
                path: "component.data_source".to_string(),
            },
            ValidationError::MissingResource {
                path: "data_sources.test".to_string(),
            },
            ValidationError::InvalidFilterOp {
                path: "filter.op".to_string(),
            },
            ValidationError::InvalidAggregationType {
                path: "agg.type".to_string(),
            },
            ValidationError::InvalidGridColumns {
                value: 0,
                path: "layout.props.columns".to_string(),
            },
            ValidationError::InvalidChartVariant {
                path: "component.variant".to_string(),
            },
            ValidationError::EmptyTableColumns {
                path: "component.columns".to_string(),
            },
            ValidationError::MissingRequiredField {
                field: "version".to_string(),
                path: "root".to_string(),
            },
            ValidationError::InvalidType {
                path: "schema".to_string(),
                message: "not an object".to_string(),
            },
            ValidationError::InvalidFilterValueType {
                path: "filter.value".to_string(),
            },
            ValidationError::MissingFilterField {
                field: "op".to_string(),
                path: "filter".to_string(),
            },
            ValidationError::MissingAggregationField {
                field: "type".to_string(),
                path: "agg".to_string(),
            },
            ValidationError::InvalidSortDirection {
                path: "sort.direction".to_string(),
            },
            ValidationError::MissingSortField {
                field: "field".to_string(),
                path: "sort".to_string(),
            },
            ValidationError::InvalidLimit {
                value: "negative".to_string(),
                path: "limit".to_string(),
            },
        ];

        for error in errors {
            let msg = format!("{}", error);
            assert!(!msg.is_empty());
        }
    }

    #[test]
    fn test_valid_minimal_schema() {
        let schema = LiquidViewSchema {
            version: "1.0".to_string(),
            layout: Layout::Grid {
                props: GridLayoutProps {
                    columns: 2,
                    gap: None,
                },
                children: vec![],
            },
            data_sources: HashMap::new(),
        };

        let validator = SchemaValidator::new();
        let result = validator.validate(&schema);
        assert!(result.valid);
        assert_eq!(result.errors.len(), 0);
    }

    #[test]
    fn test_valid_stack_layout() {
        let schema = LiquidViewSchema {
            version: "1.0".to_string(),
            layout: Layout::Stack {
                props: StackLayoutProps {
                    direction: StackDirection::Vertical,
                    spacing: Some(8),
                },
                children: vec![],
            },
            data_sources: HashMap::new(),
        };

        let validator = SchemaValidator::new();
        let result = validator.validate(&schema);
        assert!(result.valid);
        assert_eq!(result.errors.len(), 0);
    }

    #[test]
    fn test_valid_chart_component() {
        let schema = LiquidViewSchema {
            version: "1.0".to_string(),
            layout: Layout::Grid {
                props: GridLayoutProps {
                    columns: 1,
                    gap: None,
                },
                children: vec![Component::Chart {
                    title: Some("Test Chart".to_string()),
                    data_source: None,
                    variant: ChartVariant::Bar,
                    x_axis: Some("x".to_string()),
                    y_axis: Some("y".to_string()),
                }],
            },
            data_sources: HashMap::new(),
        };

        let validator = SchemaValidator::new();
        let result = validator.validate(&schema);
        assert!(result.valid);
        assert_eq!(result.errors.len(), 0);
    }

    #[test]
    fn test_unsupported_version() {
        let schema = LiquidViewSchema {
            version: "2.0".to_string(),
            layout: Layout::Grid {
                props: GridLayoutProps {
                    columns: 2,
                    gap: None,
                },
                children: vec![],
            },
            data_sources: HashMap::new(),
        };

        let validator = SchemaValidator::new();
        let result = validator.validate(&schema);
        assert!(!result.valid);
        assert!(matches!(
            result.errors[0],
            ValidationError::UnsupportedVersion(_)
        ));
    }

    #[test]
    fn test_invalid_grid_columns_zero() {
        let schema = LiquidViewSchema {
            version: "1.0".to_string(),
            layout: Layout::Grid {
                props: GridLayoutProps {
                    columns: 0,
                    gap: None,
                },
                children: vec![],
            },
            data_sources: HashMap::new(),
        };

        let validator = SchemaValidator::new();
        let result = validator.validate(&schema);
        assert!(!result.valid);
        assert!(matches!(
            result.errors[0],
            ValidationError::InvalidGridColumns { .. }
        ));
    }

    #[test]
    fn test_empty_table_columns() {
        let schema = LiquidViewSchema {
            version: "1.0".to_string(),
            layout: Layout::Grid {
                props: GridLayoutProps {
                    columns: 1,
                    gap: None,
                },
                children: vec![Component::Table {
                    title: None,
                    data_source: None,
                    columns: vec![],
                    sortable: None,
                }],
            },
            data_sources: HashMap::new(),
        };

        let validator = SchemaValidator::new();
        let result = validator.validate(&schema);
        assert!(!result.valid);
        assert!(matches!(
            result.errors[0],
            ValidationError::EmptyTableColumns { .. }
        ));
    }

    #[test]
    fn test_dangling_data_source_ref() {
        let schema = LiquidViewSchema {
            version: "1.0".to_string(),
            layout: Layout::Grid {
                props: GridLayoutProps {
                    columns: 1,
                    gap: None,
                },
                children: vec![Component::Chart {
                    title: None,
                    data_source: Some("non_existent".to_string()),
                    variant: ChartVariant::Bar,
                    x_axis: None,
                    y_axis: None,
                }],
            },
            data_sources: HashMap::new(),
        };

        let validator = SchemaValidator::new();
        let result = validator.validate(&schema);
        assert!(!result.valid);
        assert!(matches!(
            result.errors[0],
            ValidationError::DanglingDataSourceRef { .. }
        ));
    }

    #[test]
    fn test_filter_value_type_in_with_scalar() {
        let mut data_sources = HashMap::new();
        data_sources.insert(
            "test_ds".to_string(),
            DataSource {
                resource: "products".to_string(),
                filters: Some(vec![Filter {
                    field: "category".to_string(),
                    op: FilterOperator::In,
                    value: FilterValue::String("electronics".to_string()),
                }]),
                aggregation: None,
                sort: None,
                limit: None,
            },
        );

        let schema = LiquidViewSchema {
            version: "1.0".to_string(),
            layout: Layout::Grid {
                props: GridLayoutProps {
                    columns: 1,
                    gap: None,
                },
                children: vec![],
            },
            data_sources,
        };

        let validator = SchemaValidator::new();
        let result = validator.validate(&schema);
        assert!(!result.valid);
        assert!(matches!(
            result.errors[0],
            ValidationError::InvalidFilterValueType { .. }
        ));
    }

    #[test]
    fn test_filter_value_type_eq_with_array() {
        let mut data_sources = HashMap::new();
        data_sources.insert(
            "test_ds".to_string(),
            DataSource {
                resource: "products".to_string(),
                filters: Some(vec![Filter {
                    field: "id".to_string(),
                    op: FilterOperator::Eq,
                    value: FilterValue::Array(vec![
                        FilterValueScalar::Number(1.0),
                        FilterValueScalar::Number(2.0),
                    ]),
                }]),
                aggregation: None,
                sort: None,
                limit: None,
            },
        );

        let schema = LiquidViewSchema {
            version: "1.0".to_string(),
            layout: Layout::Grid {
                props: GridLayoutProps {
                    columns: 1,
                    gap: None,
                },
                children: vec![],
            },
            data_sources,
        };

        let validator = SchemaValidator::new();
        let result = validator.validate(&schema);
        assert!(!result.valid);
        assert!(matches!(
            result.errors[0],
            ValidationError::InvalidFilterValueType { .. }
        ));
    }
}
