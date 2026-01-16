import type { LiquidViewSchema } from "@liqueur/protocol";
import type { ValidationResult } from "../types";

/**
 * SchemaValidator - Shared validation logic for AI provider responses
 *
 * This helper eliminates 65 lines of duplicated code across all providers:
 * - BaseAIProvider
 * - MockProvider
 * - Any future providers
 *
 * Single source of truth for schema validation rules.
 */
export class SchemaValidator {
  /**
   * Validates that a response conforms to LiquidViewSchema structure
   *
   * Checks for:
   * - Response is an object (not null, string, array, etc.)
   * - Required fields: version, layout, components, data_sources
   *
   * @param response Unknown response from AI or mock generator
   * @returns ValidationResult with valid flag, errors array, and parsed schema
   */
  static validateResponse(response: unknown): ValidationResult {
    // Type guard
    if (!response || typeof response !== "object") {
      return {
        valid: false,
        errors: [
          {
            code: "INVALID_RESPONSE_TYPE",
            message: "Response must be an object",
          },
        ],
      };
    }

    const obj = response as Record<string, unknown>;

    // Check required fields
    const errors: ValidationResult["errors"] = [];

    if (!obj.version) {
      errors.push({
        code: "MISSING_VERSION",
        message: "Schema version is required",
        path: "version",
      });
    }

    if (!obj.layout) {
      errors.push({
        code: "MISSING_LAYOUT",
        message: "Schema layout is required",
        path: "layout",
      });
    }

    if (!obj.components) {
      errors.push({
        code: "MISSING_COMPONENTS",
        message: "Schema components are required",
        path: "components",
      });
    }

    if (!obj.data_sources) {
      errors.push({
        code: "MISSING_DATA_SOURCES",
        message: "Schema data_sources are required",
        path: "data_sources",
      });
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }

    // Basic validation passed
    return {
      valid: true,
      errors: [],
      schema: response as LiquidViewSchema,
    };
  }
}
