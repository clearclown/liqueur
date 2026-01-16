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
import { parseRequestBody, createErrorResponse, validateRequiredFields } from "@/lib/apiHelpers";
import type { ErrorResponse } from "@/lib/types/api";

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
 * POST /api/liquid/generate
 * AI生成エンドポイント
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerateResponse | ErrorResponse>> {
  try {
    // リクエストボディのパース
    const parseResult = await parseRequestBody<GenerateRequest>(request);
    if (!parseResult.success) {
      return parseResult.response;
    }
    const body = parseResult.data;

    // 必須フィールドのバリデーション
    const validationResult = validateRequiredFields(body, ["prompt", "metadata"]);
    if (!validationResult.valid) {
      return validationResult.response;
    }

    // prompt検証
    if (typeof body.prompt !== "string" || body.prompt.trim() === "") {
      return createErrorResponse(
        "EMPTY_PROMPT",
        "Prompt cannot be empty or whitespace only",
        400
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

    return createErrorResponse(
      "INTERNAL_ERROR",
      "An error occurred during schema generation",
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
