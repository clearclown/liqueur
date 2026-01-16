/**
 * Artifact Individual CRUD API Endpoints
 * GET    /api/liquid/artifacts/:id - Get artifact by id
 * PUT    /api/liquid/artifacts/:id - Update artifact
 * DELETE /api/liquid/artifacts/:id - Delete artifact
 */

import { NextRequest, NextResponse } from "next/server";
import type { LiquidViewSchema } from "@liqueur/protocol";
import { artifactStore } from "@/lib/artifactStore";

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
 * GET /api/liquid/artifacts/:id
 * 指定されたIDのArtifactを取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const artifact = await artifactStore.get(params.id);

    if (!artifact) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "ARTIFACT_NOT_FOUND",
            message: `Artifact with id "${params.id}" not found`,
          },
        },
        { status: 404 }
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

    return NextResponse.json<ErrorResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get artifact",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/liquid/artifacts/:id
 * Artifactを更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 既存のArtifactを取得
    const existingArtifact = await artifactStore.get(params.id);
    if (!existingArtifact) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "ARTIFACT_NOT_FOUND",
            message: `Artifact with id "${params.id}" not found`,
          },
        },
        { status: 404 }
      );
    }

    // 更新内容の準備
    const updates: { title?: string; schema?: LiquidViewSchema } = {};

    if (body.name !== undefined) {
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
      updates.title = body.name;
    }

    if (body.schema !== undefined) {
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
      updates.schema = schema;
    }

    // 更新実行
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

    return NextResponse.json<ErrorResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update artifact",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/liquid/artifacts/:id
 * Artifactを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // "Artifact not found" エラーの場合は404を返す
    if (error instanceof Error && error.message === "Artifact not found") {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "ARTIFACT_NOT_FOUND",
            message: `Artifact with id "${params.id}" not found`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ErrorResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete artifact",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
