/**
 * Database Metadata API Endpoint
 * GET /api/liquid/metadata
 *
 * Returns database schema metadata for AI context
 */

import { NextRequest, NextResponse } from "next/server";
import type { DatabaseMetadata } from "@liqueur/ai-provider";
import type { ErrorResponse } from "@/lib/types/api";

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
 * GET /api/liquid/metadata
 * Database schema metadata取得
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse<MetadataResponse | ErrorResponse>> {
  try {
    // Get database metadata
    // TODO: Implement actual database introspection
    const metadata = getMockMetadata();

    const response: MetadataResponse = {
      metadata,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Metadata Generation Error:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to generate database metadata",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
