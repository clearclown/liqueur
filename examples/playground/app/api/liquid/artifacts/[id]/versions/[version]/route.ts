/**
 * Specific Version API
 * GET    /api/liquid/artifacts/:id/versions/:version - Get specific version
 * DELETE /api/liquid/artifacts/:id/versions/:version - Delete specific version
 */

import { NextRequest, NextResponse } from "next/server";
import { artifactStore } from "@/lib/artifactStore";

interface RouteContext {
  params: Promise<{ id: string; version: string }>;
}

/**
 * GET /api/liquid/artifacts/:id/versions/:version
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id, version: versionStr } = await context.params;
    const version = parseInt(versionStr, 10);

    if (isNaN(version) || version < 1) {
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
    const versionData = await store.getVersion(id, version);

    if (!versionData) {
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

    return NextResponse.json({ version: versionData });
  } catch (error) {
    console.error("Get version error:", error);

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
          message: error instanceof Error ? error.message : "Failed to get version",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/liquid/artifacts/:id/versions/:version
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id, version: versionStr } = await context.params;
    const version = parseInt(versionStr, 10);

    if (isNaN(version) || version < 1) {
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
    await store.deleteVersion(id, version);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete version error:", error);

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

      if (error.message === "Cannot delete current version") {
        return NextResponse.json(
          {
            error: {
              code: "CANNOT_DELETE_CURRENT",
              message: "Cannot delete the current version",
            },
          },
          { status: 400 }
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
          message: error instanceof Error ? error.message : "Failed to delete version",
        },
      },
      { status: 500 }
    );
  }
}
