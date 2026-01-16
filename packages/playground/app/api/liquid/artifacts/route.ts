/**
 * Artifact CRUD API Endpoints
 * GET  /api/liquid/artifacts - List all artifacts
 * POST /api/liquid/artifacts - Create new artifact
 */

import { NextRequest, NextResponse } from "next/server";
import type { LiquidViewSchema } from "@liqueur/protocol";
import { SchemaValidator } from "@liqueur/protocol";
import { artifactStore } from "@/lib/artifactStore";
import { parseRequestBody, createErrorResponse, validateRequiredFields } from "@/lib/apiHelpers";
import type { ErrorResponse } from "@/lib/types/api";
import { getCurrentUser } from "@/lib/auth/context";

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
 * Create request type
 */
interface CreateArtifactRequest {
  name: string;
  schema: LiquidViewSchema;
}

/**
 * GET /api/liquid/artifacts
 * 全Artifactのリストを取得
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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
    return createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to list artifacts",
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * POST /api/liquid/artifacts
 * 新しいArtifactを作成
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ artifact: Artifact } | ErrorResponse>> {
  try {
    // リクエストボディのパース
    const parseResult = await parseRequestBody<CreateArtifactRequest>(request);
    if (!parseResult.success) {
      return parseResult.response;
    }
    const body = parseResult.data;

    // 必須フィールドのバリデーション
    const validationResult = validateRequiredFields(body, ["name", "schema"]);
    if (!validationResult.valid) {
      return validationResult.response;
    }

    // 名前の空白文字列チェック
    if (typeof body.name !== "string" || body.name.trim() === "") {
      return createErrorResponse(
        "EMPTY_NAME",
        "Name cannot be empty or whitespace only",
        400
      );
    }

    // スキーマ厳密検証 (SchemaValidator使用)
    const schemaValidator = new SchemaValidator();
    const schemaValidation = schemaValidator.validate(body.schema);
    if (!schemaValidation.valid) {
      const firstError = schemaValidation.errors[0];
      return createErrorResponse(
        "INVALID_SCHEMA",
        `Schema validation failed: ${firstError.message}`,
        400,
        `Field: ${firstError.field}, Code: ${firstError.code}`
      );
    }

    // Artifactの作成
    const userId = getCurrentUser(request);
    const artifact = await artifactStore.create(
      {
        title: body.name,
        schema: body.schema,
      },
      userId
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
    return createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to create artifact",
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
