/**
 * Artifact Versions API
 * GET  /api/liquid/artifacts/:id/versions - List all versions
 * POST /api/liquid/artifacts/:id/versions - Create new version
 */

import { NextRequest, NextResponse } from "next/server";
import { artifactStore } from "@/lib/artifactStore";
import type { CreateVersionInput } from "@liqueur/artifact-store";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/liquid/artifacts/:id/versions - List all versions
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const store = artifactStore;

    const versions = await store.listVersions(id);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("List versions error:", error);

    if (error instanceof Error && error.message === "Artifact not found") {
      return NextResponse.json(
        {
          error: {
            code: "ARTIFACT_NOT_FOUND",
            message: "Artifact not found",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to list versions",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/liquid/artifacts/:id/versions - Create new version
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const store = artifactStore;

    let body: CreateVersionInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON",
          },
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.schema) {
      return NextResponse.json(
        {
          error: {
            code: "MISSING_SCHEMA",
            message: "schema is required",
          },
        },
        { status: 400 }
      );
    }

    // TODO: Get userId from auth context
    const userId = "anonymous";

    const version = await store.createVersion(id, body, userId);

    return NextResponse.json({ version });
  } catch (error) {
    console.error("Create version error:", error);

    if (error instanceof Error && error.message === "Artifact not found") {
      return NextResponse.json(
        {
          error: {
            code: "ARTIFACT_NOT_FOUND",
            message: "Artifact not found",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to create version",
        },
      },
      { status: 500 }
    );
  }
}
