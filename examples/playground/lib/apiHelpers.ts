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
export function validateRequiredFields(
  body: Record<string, unknown>,
  fields: string[]
): { valid: true } | { valid: false; response: NextResponse<ErrorResponse> } {
  for (const field of fields) {
    if (!body[field]) {
      const fieldName = field.toUpperCase();
      return {
        valid: false,
        response: createErrorResponse(
          `MISSING_${fieldName}` as ApiErrorCode,
          `Request must include '${field}' field`,
          400
        ),
      };
    }
  }
  return { valid: true };
}

/**
 * Validate string field (non-empty, max length)
 */
export function validateString(
  value: unknown,
  fieldName: string,
  options: { maxLength?: number; minLength?: number } = {}
): { valid: true } | { valid: false; response: NextResponse<ErrorResponse> } {
  if (typeof value !== "string") {
    return {
      valid: false,
      response: createErrorResponse(
        "INVALID_TYPE",
        `Field '${fieldName}' must be a string`,
        400
      ),
    };
  }

  const trimmed = value.trim();

  if (options.minLength !== undefined && trimmed.length < options.minLength) {
    return {
      valid: false,
      response: createErrorResponse(
        "INVALID_LENGTH",
        `Field '${fieldName}' must be at least ${options.minLength} characters`,
        400
      ),
    };
  }

  if (options.maxLength !== undefined && trimmed.length > options.maxLength) {
    return {
      valid: false,
      response: createErrorResponse(
        "INVALID_LENGTH",
        `Field '${fieldName}' must be at most ${options.maxLength} characters`,
        400
      ),
    };
  }

  return { valid: true };
}

/**
 * Rate limiting store (in-memory, per-process)
 * Production: Use Redis or similar distributed cache
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple rate limiter
 * Returns true if request is allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    // Rate limit exceeded
    return false;
  }

  // Increment count
  record.count++;
  return true;
}

/**
 * Get rate limit info for identifier
 */
export function getRateLimitInfo(identifier: string): {
  remaining: number;
  resetAt: number;
} | null {
  const record = rateLimitStore.get(identifier);
  if (!record) return null;

  const maxRequests = parseInt(process.env.AI_REQUEST_LIMIT_PER_MINUTE || "10");
  return {
    remaining: Math.max(0, maxRequests - record.count),
    resetAt: record.resetAt,
  };
}
