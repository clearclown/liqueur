/**
 * Test Helper Utilities
 * Shared utilities for API route tests
 */

import { NextRequest } from "next/server";

/**
 * Create a mock NextRequest for testing API routes
 * @param url - Full URL for the request
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param body - Optional request body (will be JSON stringified)
 * @returns Mock NextRequest instance
 */
export function createMockRequest(url: string, method: string, body?: unknown): NextRequest {
  const request = new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return request;
}
