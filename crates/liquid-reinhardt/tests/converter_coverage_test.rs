use liquid_protocol::{DataSource, Filter, FilterOperator, FilterValue};
use liquid_reinhardt::converter::{DataSourceConverter, QueryCondition};

/// Coverage improvement tests

#[test]
fn test_query_condition_all_field_accessors() {
    // Test all QueryCondition variants' field() method
    let conditions = vec![
        QueryCondition::Neq { field: "f1".to_string(), value: "v".to_string() },
        QueryCondition::Gte { field: "f2".to_string(), value: 10.0 },
        QueryCondition::Lt { field: "f3".to_string(), value: 20.0 },
        QueryCondition::Lte { field: "f4".to_string(), value: 30.0 },
        QueryCondition::Contains { field: "f5".to_string(), value: "sub".to_string() },
    ];

    assert_eq!(conditions[0].field(), "f1");
    assert_eq!(conditions[1].field(), "f2");
    assert_eq!(conditions[2].field(), "f3");
    assert_eq!(conditions[3].field(), "f4");
    assert_eq!(conditions[4].field(), "f5");
}

#[test]
fn test_conversion_error_accessors() {
    use liquid_reinhardt::ConversionError;

    let err = ConversionError::new("TEST_CODE", "Test message");

    assert_eq!(err.code(), "TEST_CODE");
    assert_eq!(err.message(), "Test message");
}

#[test]
fn test_error_on_number_expected() {
    let ds = DataSource {
        resource: "test".to_string(),
        filters: Some(vec![Filter {
            field: "age".to_string(),
            op: FilterOperator::Gt,
            value: FilterValue::String("not_a_number".to_string()),
        }]),
        aggregation: None,
        sort: None,
        limit: None,
    };

    let converter = DataSourceConverter::new();
    let result = converter.convert(&ds);

    assert!(result.is_err());
    assert_eq!(result.unwrap_err().code(), "INVALID_FILTER_VALUE_TYPE");
}

#[test]
fn test_error_on_array_expected_for_in() {
    let ds = DataSource {
        resource: "test".to_string(),
        filters: Some(vec![Filter {
            field: "status".to_string(),
            op: FilterOperator::In,
            value: FilterValue::String("not_an_array".to_string()),
        }]),
        aggregation: None,
        sort: None,
        limit: None,
    };

    let converter = DataSourceConverter::new();
    let result = converter.convert(&ds);

    assert!(result.is_err());
    assert_eq!(result.unwrap_err().code(), "INVALID_FILTER_VALUE_TYPE");
}

#[test]
fn test_convert_boolean_value() {
    let ds = DataSource {
        resource: "test".to_string(),
        filters: Some(vec![Filter {
            field: "active".to_string(),
            op: FilterOperator::Eq,
            value: FilterValue::Boolean(true),
        }]),
        aggregation: None,
        sort: None,
        limit: None,
    };

    let converter = DataSourceConverter::new();
    let query = converter.convert(&ds).unwrap();

    let condition = &query.conditions()[0];
    match condition {
        QueryCondition::Eq { value, .. } => {
            assert_eq!(value, "true");
        }
        _ => panic!("Expected Eq condition"),
    }
}

#[test]
fn test_default_implementation() {
    let _converter = DataSourceConverter::default();
    // Just ensure Default trait works
}
