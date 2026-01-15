//! Liquid Protocol v1.0 - Serde Schema Definitions
//!
//! JSON Schema-based protocol for AI-driven dynamic UI generation
//! with enterprise-grade security and type safety.
//!
//! This module provides Rust type definitions that mirror the TypeScript
//! protocol specification for cross-language compatibility.

use serde::{Deserialize, Serialize};

/// Protocol version
/// Currently only "1.0" is supported
pub type ProtocolVersion = String;

/// Root schema object defining complete UI structure
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LiquidViewSchema {
    /// Protocol version
    pub version: ProtocolVersion,
    /// UI layout structure
    pub layout: Layout,
    /// Data source definitions
    #[serde(default)]
    pub data_sources: std::collections::HashMap<String, DataSource>,
}

/// Layout types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Layout {
    /// CSS Grid-based layout
    Grid {
        props: GridLayoutProps,
        children: Vec<Component>,
    },
    /// Flexbox-based layout
    Stack {
        props: StackLayoutProps,
        children: Vec<Component>,
    },
}

/// Grid layout properties
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GridLayoutProps {
    /// Number of columns (must be >= 1)
    pub columns: u32,
    /// Grid gap in pixels (default: 16)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gap: Option<u32>,
}

/// Stack layout properties
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StackLayoutProps {
    /// Stack direction
    pub direction: StackDirection,
    /// Item spacing in pixels (default: 8)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub spacing: Option<u32>,
}

/// Stack direction
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum StackDirection {
    Horizontal,
    Vertical,
}

/// UI Component types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Component {
    /// Chart component (Recharts integration)
    Chart {
        #[serde(skip_serializing_if = "Option::is_none")]
        title: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        data_source: Option<String>,
        variant: ChartVariant,
        #[serde(skip_serializing_if = "Option::is_none", rename = "xAxis")]
        x_axis: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none", rename = "yAxis")]
        y_axis: Option<String>,
    },
    /// Table component
    Table {
        #[serde(skip_serializing_if = "Option::is_none")]
        title: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        data_source: Option<String>,
        columns: Vec<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        sortable: Option<bool>,
    },
}

/// Chart variants
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ChartVariant {
    Bar,
    Line,
    Pie,
    Area,
}

/// Data source definition
/// Converted to ORM queries in backend
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DataSource {
    /// Resource name (table/model name)
    pub resource: String,
    /// Filter conditions
    #[serde(skip_serializing_if = "Option::is_none")]
    pub filters: Option<Vec<Filter>>,
    /// Aggregation method
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aggregation: Option<Aggregation>,
    /// Sort condition
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sort: Option<Sort>,
    /// Result limit
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<u32>,
}

/// Filter condition
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Filter {
    /// Field name
    pub field: String,
    /// Filter operator
    pub op: FilterOperator,
    /// Filter value
    pub value: FilterValue,
}

/// Filter value types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum FilterValue {
    String(String),
    Number(f64),
    Boolean(bool),
    Array(Vec<FilterValueScalar>),
}

/// Scalar filter values (for array elements)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum FilterValueScalar {
    String(String),
    Number(f64),
}

/// Filter operators
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FilterOperator {
    /// Equal
    Eq,
    /// Not equal
    Neq,
    /// Greater than
    Gt,
    /// Greater than or equal
    Gte,
    /// Less than
    Lt,
    /// Less than or equal
    Lte,
    /// In array
    In,
    /// Partial match
    Contains,
}

/// Aggregation method
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Aggregation {
    /// Aggregation type
    #[serde(rename = "type")]
    pub agg_type: AggregationType,
    /// Target field for aggregation
    pub field: String,
    /// GROUP BY field (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub by: Option<String>,
}

/// Aggregation types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AggregationType {
    Sum,
    Avg,
    Count,
    Min,
    Max,
}

/// Sort condition
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Sort {
    /// Sort field
    pub field: String,
    /// Sort direction
    pub direction: SortDirection,
}

/// Sort directions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SortDirection {
    Asc,
    Desc,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_protocol_version() {
        let version: ProtocolVersion = "1.0".to_string();
        assert_eq!(version, "1.0");
    }

    #[test]
    fn test_chart_variant_serialization() {
        let variant = ChartVariant::Bar;
        let json = serde_json::to_string(&variant).unwrap();
        assert_eq!(json, "\"bar\"");
    }

    #[test]
    fn test_filter_operator_serialization() {
        let op = FilterOperator::Eq;
        let json = serde_json::to_string(&op).unwrap();
        assert_eq!(json, "\"eq\"");
    }

    #[test]
    fn test_aggregation_type_serialization() {
        let agg = AggregationType::Sum;
        let json = serde_json::to_string(&agg).unwrap();
        assert_eq!(json, "\"sum\"");
    }

    #[test]
    fn test_sort_direction_serialization() {
        let dir = SortDirection::Asc;
        let json = serde_json::to_string(&dir).unwrap();
        assert_eq!(json, "\"asc\"");
    }
}
