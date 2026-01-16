/**
 * Artifact CRUD API Endpoints
 * GET  /api/liquid/artifacts - List all artifacts
 * POST /api/liquid/artifacts - Create new artifact
 */

import { NextRequest, NextResponse } from "next/server";
import type { LiquidViewSchema } from "@liqueur/protocol";
import { artifactStore } from "@/lib/artifactStore";

/**
 * Artifact type
 */
interface Artifact {
  id: string;
  name: string;
  schema: LiquidViewSchema;
  createdAt: string;
  updatedAt: string;
}

/**
 * Error response type
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * GET /api/liquid/artifacts
 * 全Artifactのリストを取得
 */
export async function GET(request: NextRequest) {
  try {
    const result = await artifactStore.list();

    return NextResponse.json(
      {
        artifacts: result.artifacts.map((a) => ({
          id: a.id,
          name: a.title,
          schema: a.schema,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("List Artifacts Error:", error);

    return NextResponse.json<ErrorResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to list artifacts",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/liquid/artifacts
 * 新しいArtifactを作成
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディのパース
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON",
            details: error instanceof Error ? error.message : String(error),
          },
        },
        { status: 400 }
      );
    }

    // バリデーション: name
    if (!body.name) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "MISSING_NAME",
            message: "Request must include 'name' field",
          },
        },
        { status: 400 }
      );
    }

    if (typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "EMPTY_NAME",
            message: "Name cannot be empty or whitespace only",
          },
        },
        { status: 400 }
      );
    }

    // バリデーション: schema
    if (!body.schema) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "MISSING_SCHEMA",
            message: "Request must include 'schema' field",
          },
        },
        { status: 400 }
      );
    }

    // スキーマの基本構造チェック
    const schema = body.schema;
    if (
      !schema.version ||
      !schema.layout ||
      !schema.components ||
      !schema.data_sources
    ) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "INVALID_SCHEMA",
            message: "Schema must have version, layout, components, and data_sources fields",
          },
        },
        { status: 400 }
      );
    }

    // Artifactを保存
    const artifact = await artifactStore.create(
      {
        title: body.name,
        schema: schema,
      },
      "test-user" // TODO: 本番では実際のユーザーIDを使用
    );

    return NextResponse.json(
      {
        artifact: {
          id: artifact.id,
          name: artifact.title,
          schema: artifact.schema,
          createdAt: artifact.createdAt.toISOString(),
          updatedAt: artifact.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Artifact Error:", error);

    return NextResponse.json<ErrorResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create artifact",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
