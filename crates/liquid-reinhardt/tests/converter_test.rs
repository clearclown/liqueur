use liquid_protocol::FilterValueScalar;
use liquid_protocol::{DataSource, Filter, FilterOperator, FilterValue};
use liquid_reinhardt::converter::{DataSourceConverter, QueryCondition};

/// FR-06: DataSource → ORM Converter Tests (TDD Red Phase)

#[test]
fn test_convert_simple_resource_only() {
    let ds = DataSource {
        resource: "users".to_string(),
        filters: None,
        aggregation: None,
        sort: None,
        limit: None,
    };

    let converter = DataSourceConverter::new();
    let query = converter.convert(&ds).unwrap();

    assert_eq!(query.resource(), "users");
    assert!(query.conditions().is_empty());
}

#[test]
fn test_convert_with_eq_filter() {
    let ds = DataSource {
        resource: "expenses".to_string(),
        filters: Some(vec![Filter {
            field: "category".to_string(),
            op: FilterOperator::Eq,
            value: FilterValue::String("food".to_string()),
        }]),
        aggregation: None,
        sort: None,
        limit: None,
    };

    let converter = DataSourceConverter::new();
    let query = converter.convert(&ds).unwrap();

    assert_eq!(query.resource(), "expenses");
    assert_eq!(query.conditions().len(), 1);

    let condition = &query.conditions()[0];
    assert_eq!(condition.field(), "category");
    match condition {
        QueryCondition::Eq { field, value } => {
            assert_eq!(field, "category");
            assert_eq!(value, "food");
        }
        _ => panic!("Expected Eq condition"),
    }
}

#[test]
fn test_convert_with_neq_filter() {
    let ds = DataSource {
        resource: "expenses".to_string(),
        filters: Some(vec![Filter {
            field: "category".to_string(),
            op: FilterOperator::Neq,
            value: FilterValue::String("travel".to_string()),
        }]),
        aggregation: None,
        sort: None,
        limit: None,
    };

    let converter = DataSourceConverter::new();
    let query = converter.convert(&ds).unwrap();

    let condition = &query.conditions()[0];
    match condition {
        QueryCondition::Neq { field, value } => {
            assert_eq!(field, "category");
            assert_eq!(value, "travel");
        }
        _ => panic!("Expected Neq condition"),
    }
}

#[test]
fn test_convert_with_gt_filter() {
    let ds = DataSource {
        resource: "users".to_string(),
        filters: Some(vec![Filter {
            field: "age".to_string(),
            op: FilterOperator::Gt,
            value: FilterValue::Number(18.0),
        }]),
        aggregation: None,
        sort: None,
        limit: None,
    };

    let converter = DataSourceConverter::new();
    let query = converter.convert(&ds).unwrap();

    let condition = &query.conditions()[0];
    match condition {
        QueryCondition::Gt { field, value } => {
            assert_eq!(field, "age");
            assert_eq!(*value, 18.0);
        }
        _ => panic!("Expected Gt condition"),
    }
}

#[test]
fn test_convert_with_in_filter() {
    let ds = DataSource {
        resource: "products".to_string(),
        filters: Some(vec![Filter {
            field: "status".to_string(),
            op: FilterOperator::In,
            value: FilterValue::Array(vec![
                FilterValueScalar::String("active".to_string()),
                FilterValueScalar::String("pending".to_string()),
            ]),
        }]),
        aggregation: None,
        sort: None,
        limit: None,
    };

    let converter = DataSourceConverter::new();
    let query = converter.convert(&ds).unwrap();

    let condition = &query.conditions()[0];
    match condition {
        QueryCondition::In { field, values } => {
            assert_eq!(field, "status");
            assert_eq!(values.len(), 2);
        }
        _ => panic!("Expected In condition"),
    }
}

#[test]
fn test_convert_with_multiple_filters() {
    let ds = DataSource {
        resource: "orders".to_string(),
        filters: Some(vec![
            Filter {
                field: "status".to_string(),
                op: FilterOperator::Eq,
                value: FilterValue::String("completed".to_string()),
            },
            Filter {
                field: "amount".to_string(),
                op: FilterOperator::Gt,
                value: FilterValue::Number(100.0),
            },
        ]),
        aggregation: None,
        sort: None,
        limit: None,
    };

    let converter = DataSourceConverter::new();
    let query = converter.convert(&ds).unwrap();

    assert_eq!(query.conditions().len(), 2);
}

#[test]
fn test_convert_with_limit() {
    let ds = DataSource {
        resource: "posts".to_string(),
        filters: None,
        aggregation: None,
        sort: None,
        limit: Some(10),
    };

    let converter = DataSourceConverter::new();
    let query = converter.convert(&ds).unwrap();

    assert_eq!(query.limit(), Some(10));
}

#[test]
fn test_convert_with_all_filter_operators() {
    let operators = vec![
        (FilterOperator::Eq, FilterValue::String("test".to_string())),
        (FilterOperator::Neq, FilterValue::String("test".to_string())),
        (FilterOperator::Gt, FilterValue::Number(10.0)),
        (FilterOperator::Gte, FilterValue::Number(10.0)),
        (FilterOperator::Lt, FilterValue::Number(10.0)),
        (FilterOperator::Lte, FilterValue::Number(10.0)),
        (FilterOperator::Contains, FilterValue::String("substring".to_string())),
    ];

    let converter = DataSourceConverter::new();

    for (op, value) in operators.iter().cloned() {
        let ds = DataSource {
            resource: "test".to_string(),
            filters: Some(vec![Filter {
                field: "field".to_string(),
                op: op.clone(),
                value,
            }]),
            aggregation: None,
            sort: None,
            limit: None,
        };

        let result = converter.convert(&ds);
        assert!(result.is_ok(), "Operator {:?} should be supported", op);
    }
}

#[test]
fn test_error_on_invalid_in_operator_with_non_array() {
    let ds = DataSource {
        resource: "test".to_string(),
        filters: Some(vec![Filter {
            field: "field".to_string(),
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
    let err = result.unwrap_err();
    assert_eq!(err.code(), "INVALID_FILTER_VALUE_TYPE");
}
