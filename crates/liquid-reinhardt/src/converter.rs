// FR-06: DataSource → ORM Converter Implementation

use liquid_protocol::{DataSource, Filter, FilterOperator, FilterValue, FilterValueScalar};
use std::fmt;

/// クエリ条件を表すEnum
#[derive(Debug, Clone, PartialEq)]
pub enum QueryCondition {
    Eq { field: String, value: String },
    Neq { field: String, value: String },
    Gt { field: String, value: f64 },
    Gte { field: String, value: f64 },
    Lt { field: String, value: f64 },
    Lte { field: String, value: f64 },
    In { field: String, values: Vec<String> },
    Contains { field: String, value: String },
}

impl QueryCondition {
    pub fn field(&self) -> &str {
        match self {
            QueryCondition::Eq { field, .. } => field,
            QueryCondition::Neq { field, .. } => field,
            QueryCondition::Gt { field, .. } => field,
            QueryCondition::Gte { field, .. } => field,
            QueryCondition::Lt { field, .. } => field,
            QueryCondition::Lte { field, .. } => field,
            QueryCondition::In { field, .. } => field,
            QueryCondition::Contains { field, .. } => field,
        }
    }
}

/// 変換後のクエリ構造
#[derive(Debug, Clone)]
pub struct ConvertedQuery {
    resource: String,
    conditions: Vec<QueryCondition>,
    limit: Option<usize>,
}

impl ConvertedQuery {
    pub fn new(resource: String) -> Self {
        Self {
            resource,
            conditions: Vec::new(),
            limit: None,
        }
    }

    pub fn resource(&self) -> &str {
        &self.resource
    }

    pub fn conditions(&self) -> &[QueryCondition] {
        &self.conditions
    }

    pub fn limit(&self) -> Option<usize> {
        self.limit
    }

    pub fn add_condition(&mut self, condition: QueryCondition) {
        self.conditions.push(condition);
    }

    pub fn set_limit(&mut self, limit: usize) {
        self.limit = Some(limit);
    }
}

/// 変換エラー
#[derive(Debug, Clone, PartialEq)]
pub struct ConversionError {
    code: String,
    message: String,
}

impl ConversionError {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
        }
    }

    pub fn code(&self) -> &str {
        &self.code
    }

    pub fn message(&self) -> &str {
        &self.message
    }
}

impl fmt::Display for ConversionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl std::error::Error for ConversionError {}

/// DataSource → ORM Query Converter
pub struct DataSourceConverter;

impl DataSourceConverter {
    pub fn new() -> Self {
        Self
    }

    /// DataSourceをConvertedQueryに変換
    pub fn convert(&self, ds: &DataSource) -> Result<ConvertedQuery, ConversionError> {
        let mut query = ConvertedQuery::new(ds.resource.clone());

        // フィルタ変換
        if let Some(filters) = &ds.filters {
            for filter in filters {
                let condition = self.convert_filter(filter)?;
                query.add_condition(condition);
            }
        }

        // Limit設定 (u32 → usize)
        if let Some(limit) = ds.limit {
            query.set_limit(limit as usize);
        }

        Ok(query)
    }

    /// 個別フィルタ変換
    fn convert_filter(&self, filter: &Filter) -> Result<QueryCondition, ConversionError> {
        match &filter.op {
            FilterOperator::Eq => {
                let value = self.extract_string_value(&filter.value)?;
                Ok(QueryCondition::Eq {
                    field: filter.field.clone(),
                    value,
                })
            }
            FilterOperator::Neq => {
                let value = self.extract_string_value(&filter.value)?;
                Ok(QueryCondition::Neq {
                    field: filter.field.clone(),
                    value,
                })
            }
            FilterOperator::Gt => {
                let value = self.extract_number_value(&filter.value)?;
                Ok(QueryCondition::Gt {
                    field: filter.field.clone(),
                    value,
                })
            }
            FilterOperator::Gte => {
                let value = self.extract_number_value(&filter.value)?;
                Ok(QueryCondition::Gte {
                    field: filter.field.clone(),
                    value,
                })
            }
            FilterOperator::Lt => {
                let value = self.extract_number_value(&filter.value)?;
                Ok(QueryCondition::Lt {
                    field: filter.field.clone(),
                    value,
                })
            }
            FilterOperator::Lte => {
                let value = self.extract_number_value(&filter.value)?;
                Ok(QueryCondition::Lte {
                    field: filter.field.clone(),
                    value,
                })
            }
            FilterOperator::In => {
                let values = self.extract_array_values(&filter.value)?;
                Ok(QueryCondition::In {
                    field: filter.field.clone(),
                    values,
                })
            }
            FilterOperator::Contains => {
                let value = self.extract_string_value(&filter.value)?;
                Ok(QueryCondition::Contains {
                    field: filter.field.clone(),
                    value,
                })
            }
        }
    }

    /// FilterValueから文字列を抽出
    fn extract_string_value(&self, value: &FilterValue) -> Result<String, ConversionError> {
        match value {
            FilterValue::String(s) => Ok(s.clone()),
            FilterValue::Number(n) => Ok(n.to_string()),
            FilterValue::Boolean(b) => Ok(b.to_string()),
            FilterValue::Array(_) => Err(ConversionError::new(
                "INVALID_FILTER_VALUE_TYPE",
                "Expected scalar value, got array",
            )),
        }
    }

    /// FilterValueから数値を抽出
    fn extract_number_value(&self, value: &FilterValue) -> Result<f64, ConversionError> {
        match value {
            FilterValue::Number(n) => Ok(*n),
            _ => Err(ConversionError::new(
                "INVALID_FILTER_VALUE_TYPE",
                "Expected number value",
            )),
        }
    }

    /// FilterValueから配列を抽出
    fn extract_array_values(&self, value: &FilterValue) -> Result<Vec<String>, ConversionError> {
        match value {
            FilterValue::Array(arr) => {
                let mut result = Vec::new();
                for item in arr {
                    let string_value = match item {
                        FilterValueScalar::String(s) => s.clone(),
                        FilterValueScalar::Number(n) => n.to_string(),
                    };
                    result.push(string_value);
                }
                Ok(result)
            }
            _ => Err(ConversionError::new(
                "INVALID_FILTER_VALUE_TYPE",
                "Expected array value for 'in' operator",
            )),
        }
    }
}

impl Default for DataSourceConverter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_query_condition_field() {
        let cond = QueryCondition::Eq {
            field: "test".to_string(),
            value: "value".to_string(),
        };
        assert_eq!(cond.field(), "test");
    }

    #[test]
    fn test_converted_query_new() {
        let query = ConvertedQuery::new("users".to_string());
        assert_eq!(query.resource(), "users");
        assert!(query.conditions().is_empty());
        assert_eq!(query.limit(), None);
    }

    #[test]
    fn test_conversion_error_display() {
        let err = ConversionError::new("TEST_CODE", "Test message");
        assert_eq!(format!("{}", err), "[TEST_CODE] Test message");
    }
}
