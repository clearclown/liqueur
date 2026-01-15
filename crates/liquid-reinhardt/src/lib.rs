//! Liquid Reinhardt Adapter
//!
//! reinhardt-web integration for Liquid Protocol
//!
//! This crate provides DataSource to ORM conversion (FR-06)
//! and Row-Level Security implementation (FR-07).

pub mod converter;

pub use converter::{ConversionError, ConvertedQuery, DataSourceConverter, QueryCondition};
