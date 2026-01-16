/**
 * AI Generation API Endpoint
 * POST /api/liquid/generate
 *
 * ユーザーの自然言語プロンプトからLiquidViewスキーマを生成
 */

import { NextRequest, NextResponse } from "next/server";
import type { LiquidViewSchema, DatabaseMetadata } from "@liqueur/protocol";
import { ArtifactGenerator } from "@liqueur/ai-provider/src/services/ArtifactGenerator";
import { createProviderFromEnv } from "@liqueur/ai-provider/src/factory/createProviderFromEnv";

/**
 * Request body type
 */
interface GenerateRequest {
  prompt: string;
  metadata: DatabaseMetadata;
}

/**
 * Response body type
 */
interface GenerateResponse {
  schema: LiquidViewSchema;
  metadata: {
    generatedAt: string;
    provider: string;
    estimatedCost: number;
  };
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
 * POST /api/liquid/generate
 * AI生成エンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディのパース
    let body: Partial<GenerateRequest>;
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

    // バリデーション: prompt
    if (!body.prompt) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "MISSING_PROMPT",
            message: "Request must include 'prompt' field",
          },
        },
        { status: 400 }
      );
    }

    if (typeof body.prompt !== "string" || body.prompt.trim() === "") {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "EMPTY_PROMPT",
            message: "Prompt cannot be empty or whitespace only",
          },
        },
        { status: 400 }
      );
    }

    // バリデーション: metadata
    if (!body.metadata) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "MISSING_METADATA",
            message: "Request must include 'metadata' field with database schema",
          },
        },
        { status: 400 }
      );
    }

    // AIプロバイダーの初期化
    const provider = createProviderFromEnv();
    const generator = new ArtifactGenerator(provider);

    // スキーマ生成
    const result = await generator.generateArtifact({
      userRequest: body.prompt,
      metadata: body.metadata,
    });

    // レスポンス作成
    const response: GenerateResponse = {
      schema: result.schema,
      metadata: {
        generatedAt: new Date().toISOString(),
        provider: provider.name,
        estimatedCost: result.estimatedCost,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // 内部エラー
    console.error("AI Generation Error:", error);

    return NextResponse.json<ErrorResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred during schema generation",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
