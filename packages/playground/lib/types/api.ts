/**
 * Shared API Types
 * Common types used across all API routes
 */

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Standard error codes used across APIs
 */
export const API_ERROR_CODES = {
  // JSON parsing errors
  INVALID_JSON: "INVALID_JSON",

  // Missing required fields
  MISSING_PROMPT: "MISSING_PROMPT",
  MISSING_METADATA: "MISSING_METADATA",
  MISSING_NAME: "MISSING_NAME",
  MISSING_SCHEMA: "MISSING_SCHEMA",
  MISSING_DATA_SOURCES: "MISSING_DATA_SOURCES",

  // Validation errors
  INVALID_SCHEMA: "INVALID_SCHEMA",
  INVALID_DATA_SOURCE: "INVALID_DATA_SOURCE",
  EMPTY_NAME: "EMPTY_NAME",
  EMPTY_PROMPT: "EMPTY_PROMPT",

  // Resource errors
  ARTIFACT_NOT_FOUND: "ARTIFACT_NOT_FOUND",

  // Internal errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
