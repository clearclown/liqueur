/**
 * Version Restore API
 * POST /api/liquid/artifacts/:id/restore - Restore to specific version
 */

import { NextRequest, NextResponse } from "next/server";
import { artifactStore } from "@/lib/artifactStore";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/liquid/artifacts/:id/restore
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    let body: { version: number };
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

    if (!body.version || typeof body.version !== "number") {
      return NextResponse.json(
        {
          error: {
            code: "MISSING_VERSION",
            message: "version is required and must be a number",
          },
        },
        { status: 400 }
      );
    }

    if (body.version < 1) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_VERSION",
            message: "Version must be a positive integer",
          },
        },
        { status: 400 }
      );
    }

    const store = artifactStore;
    const artifact = await store.restoreVersion(id, body.version);

    return NextResponse.json({ artifact });
  } catch (error) {
    console.error("Restore version error:", error);

    if (error instanceof Error) {
      if (error.message === "Artifact not found") {
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

      if (error.message === "Version not found") {
        return NextResponse.json(
          {
            error: {
              code: "VERSION_NOT_FOUND",
              message: "Version not found",
            },
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to restore version",
        },
      },
      { status: 500 }
    );
  }
}
