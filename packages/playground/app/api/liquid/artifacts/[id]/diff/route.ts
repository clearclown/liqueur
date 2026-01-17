/**
 * Version Diff API
 * GET /api/liquid/artifacts/:id/diff?from=1&to=2 - Get diff between versions
 */

import { NextRequest, NextResponse } from "next/server";
import { artifactStore } from "@/lib/artifactStore";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/liquid/artifacts/:id/diff
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    if (!fromStr || !toStr) {
      return NextResponse.json(
        {
          error: {
            code: "MISSING_PARAMETERS",
            message: "Both 'from' and 'to' query parameters are required",
          },
        },
        { status: 400 }
      );
    }

    const from = parseInt(fromStr, 10);
    const to = parseInt(toStr, 10);

    if (isNaN(from) || isNaN(to) || from < 1 || to < 1) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_VERSION",
            message: "Version numbers must be positive integers",
          },
        },
        { status: 400 }
      );
    }

    const store = artifactStore;
    const diff = await store.getDiff(id, from, to);

    return NextResponse.json({ diff });
  } catch (error) {
    console.error("Get diff error:", error);

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
              message: "One or both versions not found",
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
          message: error instanceof Error ? error.message : "Failed to compute diff",
        },
      },
      { status: 500 }
    );
  }
}
