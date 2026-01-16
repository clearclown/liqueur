/**
 * API Helper Utilities
 * Shared utilities for API route handlers
 */

import { NextRequest, NextResponse } from "next/server";
import type { ErrorResponse, ApiErrorCode } from "./types/api";

/**
 * Parse JSON body from request with error handling
 */
export async function parseRequestBody<T>(
  request: NextRequest
): Promise<{ success: true; data: T } | { success: false; response: NextResponse<ErrorResponse> }> {
  try {
    const body = await request.json();
    return { success: true, data: body as T };
  } catch (error) {
    return {
      success: false,
      response: createErrorResponse(
        "INVALID_JSON",
        "Request body must be valid JSON",
        400,
        error instanceof Error ? error.message : String(error)
      ),
    };
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ErrorResponse> {
  return NextResponse.json<ErrorResponse>(
    {
      error: {
        code,
        message,
        ...(details !== undefined && { details }),
      },
    },
    { status }
  );
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  body: T,
  fields: Array<keyof T>
): { valid: true } | { valid: false; response: NextResponse<ErrorResponse> } {
  for (const field of fields) {
    if (!body[field]) {
      const fieldName = String(field).toUpperCase();
      return {
        valid: false,
        response: createErrorResponse(
          `MISSING_${fieldName}` as ApiErrorCode,
          `Request must include '${String(field)}' field`,
          400
        ),
      };
    }
  }
  return { valid: true };
}
