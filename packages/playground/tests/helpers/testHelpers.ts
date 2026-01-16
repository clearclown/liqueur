/**
 * Test Helper Utilities
 * Shared utilities for API route tests
 */

import { NextRequest } from "next/server";

/**
 * Counter for unique test IPs (to avoid rate limiting in tests)
 */
let testIpCounter = 0;

/**
 * Create a mock NextRequest for testing API routes
 * @param url - Full URL for the request
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param body - Optional request body (will be JSON stringified)
 * @returns Mock NextRequest instance
 */
export function createMockRequest(url: string, method: string, body?: unknown): NextRequest {
  // 各テストに一意のIPアドレスを割り当ててレート制限を回避
  const uniqueIp = `192.168.1.${(testIpCounter++ % 254) + 1}`;

  const request = new NextRequest(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": uniqueIp,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return request;
}
