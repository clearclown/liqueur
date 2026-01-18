/**
 * AI Generation API Endpoint
 * POST /api/liquid/generate
 *
 * ユーザーの自然言語プロンプトからLiquidViewスキーマを生成
 */

import { NextRequest, NextResponse } from "next/server";
import type { LiquidViewSchema } from "@liqueur/protocol";
import type { DatabaseMetadata } from "@liqueur/ai-provider";
import { ArtifactGenerator, createProviderFromEnv } from "@liqueur/ai-provider";
import {
  parseRequestBody,
  createErrorResponse,
  validateRequiredFields,
  validateString,
  checkRateLimit,
  getRateLimitInfo,
} from "@/lib/apiHelpers";
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
    // Rate limiting (per IP address)
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitPerMinute = parseInt(process.env.AI_REQUEST_LIMIT_PER_MINUTE || "10");

    if (!checkRateLimit(clientIp, rateLimitPerMinute, 60 * 1000)) {
      const rateLimitInfo = getRateLimitInfo(clientIp);
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
            details: rateLimitInfo
              ? `Rate limit: ${rateLimitPerMinute}/min. Resets at ${new Date(rateLimitInfo.resetAt).toISOString()}`
              : undefined,
          },
        },
        {
          status: 429,
          headers: rateLimitInfo
            ? {
                "X-RateLimit-Limit": rateLimitPerMinute.toString(),
                "X-RateLimit-Remaining": rateLimitInfo.remaining.toString(),
                "X-RateLimit-Reset": rateLimitInfo.resetAt.toString(),
              }
            : {},
        }
      );
    }

    // リクエストボディのパース
    const parseResult = await parseRequestBody<GenerateRequest>(request);
    if (!parseResult.success) {
      return parseResult.response;
    }
    const body = parseResult.data;

    // 必須フィールドのバリデーション
    const validationResult = validateRequiredFields(body as unknown as Record<string, unknown>, ["prompt", "metadata"]);
    if (!validationResult.valid) {
      return validationResult.response;
    }

    // prompt厳密検証（長さ制限: 1-5000文字）
    const promptValidation = validateString(body.prompt, "prompt", {
      minLength: 1,
      maxLength: 5000,
    });
    if (!promptValidation.valid) {
      return promptValidation.response;
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
        estimatedCost: result.estimatedCost ?? 0,
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
