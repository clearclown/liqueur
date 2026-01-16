/**
 * Database Metadata API Endpoint
 * GET /api/liquid/metadata
 *
 * Returns database schema metadata for AI context
 */

import { NextRequest, NextResponse } from "next/server";
import type { DatabaseMetadata } from "@liqueur/ai-provider";
import type { ErrorResponse } from "@/lib/types/api";
import { checkRateLimit, createErrorResponse } from "@/lib/apiHelpers";

/**
 * Response body type
 */
interface MetadataResponse {
  metadata: DatabaseMetadata;
  generatedAt: string;
}

/**
 * Mock database metadata
 * TODO: Replace with actual database schema introspection
 */
function getMockMetadata(): DatabaseMetadata {
  return {
    tables: [
      {
        name: "expenses",
        description: "User expense transactions",
        columns: [
          {
            name: "id",
            type: "integer",
            nullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "user_id",
            type: "integer",
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: true,
          },
          {
            name: "category",
            type: "text",
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "amount",
            type: "decimal",
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "date",
            type: "date",
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "description",
            type: "text",
            nullable: true,
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        rowCount: 1523,
      },
      {
        name: "sales",
        description: "Product sales records",
        columns: [
          {
            name: "id",
            type: "integer",
            nullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "product",
            type: "text",
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "quantity",
            type: "integer",
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "revenue",
            type: "decimal",
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "date",
            type: "date",
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        rowCount: 834,
      },
      {
        name: "users",
        description: "User accounts",
        columns: [
          {
            name: "id",
            type: "integer",
            nullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "name",
            type: "text",
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "email",
            type: "text",
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        rowCount: 42,
      },
    ],
  };
}

/**
 * Metadata cache (in-memory)
 * Production: Use Redis with TTL
 */
let metadataCache: { data: DatabaseMetadata; generatedAt: string } | null = null;
let cacheExpiry = 0;

/**
 * GET /api/liquid/metadata
 * Database schema metadata取得
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<MetadataResponse | ErrorResponse>> {
  try {
    // Rate limiting (lighter than generate API)
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitPerMinute = 30; // Metadata is cheaper

    if (!checkRateLimit(`metadata:${clientIp}`, rateLimitPerMinute, 60 * 1000)) {
      return createErrorResponse(
        "RATE_LIMIT_EXCEEDED",
        "Too many metadata requests. Please try again later.",
        429
      );
    }

    // Check cache (default: 1 hour TTL)
    const cacheTTL = parseInt(process.env.METADATA_CACHE_TTL || "3600") * 1000;
    const now = Date.now();

    if (metadataCache && now < cacheExpiry) {
      // Return cached metadata
      return NextResponse.json(
        {
          metadata: metadataCache.data,
          generatedAt: metadataCache.generatedAt,
        },
        {
          status: 200,
          headers: {
            "X-Cache": "HIT",
            "X-Cache-Expires-At": new Date(cacheExpiry).toISOString(),
          },
        }
      );
    }

    // Get database metadata
    // TODO: Implement actual database introspection
    const metadata = getMockMetadata();
    const generatedAt = new Date().toISOString();

    // Update cache
    metadataCache = { data: metadata, generatedAt };
    cacheExpiry = now + cacheTTL;

    const response: MetadataResponse = {
      metadata,
      generatedAt,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": `private, max-age=${cacheTTL / 1000}`,
      },
    });
  } catch (error) {
    console.error("Metadata Generation Error:", error);

    return createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to generate database metadata",
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
