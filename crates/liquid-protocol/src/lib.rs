//! Liquid Protocol - Rust Implementation
//!
//! This crate provides Rust type definitions and validators for the Liquid Protocol,
//! mirroring the TypeScript specification for cross-language compatibility.

pub mod schema;
pub mod validator;

// Re-export main types
pub use schema::*;
pub use validator::{SchemaValidator, ValidationError, ValidationResult};
