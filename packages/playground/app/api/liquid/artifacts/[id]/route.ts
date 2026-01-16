/**
 * Artifact Individual CRUD API Endpoints
 * GET    /api/liquid/artifacts/:id - Get artifact by id
 * PUT    /api/liquid/artifacts/:id - Update artifact
 * DELETE /api/liquid/artifacts/:id - Delete artifact
 */

import { NextRequest, NextResponse } from "next/server";
import type { LiquidViewSchema } from "@liqueur/protocol";
import { SchemaValidator } from "@liqueur/protocol";
import { artifactStore } from "@/lib/artifactStore";
import { parseRequestBody, createErrorResponse } from "@/lib/apiHelpers";
import type { ErrorResponse } from "@/lib/types/api";

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
 * Update request type
 */
interface UpdateArtifactRequest {
  name?: string;
  schema?: LiquidViewSchema;
}

/**
 * GET /api/liquid/artifacts/:id
 * 指定されたIDのArtifactを取得
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ artifact: Artifact } | ErrorResponse>> {
  const params = await context.params;
  try {
    const artifact = await artifactStore.get(params.id);

    if (!artifact) {
      return createErrorResponse(
        "ARTIFACT_NOT_FOUND",
        `Artifact with id "${params.id}" not found`,
        404
      );
    }

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
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Artifact Error:", error);
    return createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to get artifact",
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * PUT /api/liquid/artifacts/:id
 * Artifactを更新
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ artifact: Artifact } | ErrorResponse>> {
  const params = await context.params;
  try {
    // リクエストボディのパース
    const parseResult = await parseRequestBody<UpdateArtifactRequest>(request);
    if (!parseResult.success) {
      return parseResult.response;
    }
    const body = parseResult.data;

    // 既存のArtifactを取得
    const existingArtifact = await artifactStore.get(params.id);
    if (!existingArtifact) {
      return createErrorResponse(
        "ARTIFACT_NOT_FOUND",
        `Artifact with id "${params.id}" not found`,
        404
      );
    }

    // スキーマ厳密検証（提供された場合）
    if (body.schema) {
      const schemaValidator = new SchemaValidator();
      const schemaValidation = schemaValidator.validate(body.schema);
      if (!schemaValidation.valid) {
        const firstError = schemaValidation.errors[0];
        return createErrorResponse(
          "INVALID_SCHEMA",
          `Schema validation failed: ${firstError.message}`,
          400,
          `Path: ${firstError.path}, Code: ${firstError.code}`
        );
      }
    }

    // 更新内容を構築
    const updates: { title?: string; schema?: LiquidViewSchema } = {};
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        return createErrorResponse(
          "EMPTY_NAME",
          "Name cannot be empty or whitespace only",
          400
        );
      }
      updates.title = body.name;
    }
    if (body.schema !== undefined) {
      updates.schema = body.schema;
    }

    // Artifactを更新
    const updatedArtifact = await artifactStore.update(params.id, updates);

    return NextResponse.json(
      {
        artifact: {
          id: updatedArtifact.id,
          name: updatedArtifact.title,
          schema: updatedArtifact.schema,
          createdAt: updatedArtifact.createdAt.toISOString(),
          updatedAt: updatedArtifact.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Artifact Error:", error);
    return createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to update artifact",
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * DELETE /api/liquid/artifacts/:id
 * Artifactを削除
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean } | ErrorResponse>> {
  const params = await context.params;
  try {
    await artifactStore.delete(params.id);

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Artifact Error:", error);

    if (error instanceof Error && error.message === "Artifact not found") {
      return createErrorResponse(
        "ARTIFACT_NOT_FOUND",
        `Artifact with id "${params.id}" not found`,
        404
      );
    }

    return createErrorResponse(
      "INTERNAL_ERROR",
      "Failed to delete artifact",
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
