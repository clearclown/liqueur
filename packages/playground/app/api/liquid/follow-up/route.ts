/**
 * Follow-up API Route
 * フォローアップメッセージによるスキーマ更新
 *
 * POST /api/liquid/follow-up
 */

import { NextRequest, NextResponse } from "next/server";
import type { LiquidViewSchema } from "@liqueur/protocol";
import type { DatabaseMetadata } from "@liqueur/ai-provider";
import { createProviderFromEnv } from "@liqueur/ai-provider";
import { validateString, checkRateLimit, getRateLimitInfo } from "@/lib/apiHelpers";

/**
 * Follow-up リクエストボディ
 */
interface FollowUpRequest {
  conversationId: string;
  message: string;
  currentSchema: LiquidViewSchema;
  metadata: DatabaseMetadata;
}

/**
 * スキーマの変更内容
 */
interface SchemaChange {
  type: "component_add" | "component_update" | "component_delete" | "data_source_update" | "layout_update";
  componentId?: string;
  from?: any;
  to?: any;
  description?: string;
}

/**
 * Follow-up レスポンスボディ
 */
interface FollowUpResponse {
  schema: LiquidViewSchema;
  changes: SchemaChange[];
  provider: string;
  estimatedCost: number;
}

/**
 * POST /api/liquid/follow-up - フォローアップメッセージによるスキーマ更新
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const identifier = request.headers.get("x-forwarded-for") || "anonymous";
    const allowed = checkRateLimit(identifier, 10, 60000);
    if (!allowed) {
      const rateLimitInfo = getRateLimitInfo(identifier);
      const resetInSeconds = Math.ceil((rateLimitInfo.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: `Rate limit exceeded. Try again in ${resetInSeconds}s`,
          },
        },
        { status: 429 }
      );
    }

    // Parse request body
    let body: FollowUpRequest;
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
    const { conversationId, message, currentSchema, metadata } = body;

    if (!conversationId) {
      return NextResponse.json(
        {
          error: {
            code: "MISSING_CONVERSATION_ID",
            message: "conversationId is required",
          },
        },
        { status: 400 }
      );
    }

    const messageValidation = validateString(message, "message", {
      minLength: 1,
      maxLength: 5000,
    });
    if (!messageValidation.valid) {
      return messageValidation.response;
    }

    if (!currentSchema) {
      return NextResponse.json(
        {
          error: {
            code: "MISSING_CURRENT_SCHEMA",
            message: "currentSchema is required for follow-up",
          },
        },
        { status: 400 }
      );
    }

    if (!metadata || !metadata.tables) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_METADATA",
            message: "metadata must include tables array",
          },
        },
        { status: 400 }
      );
    }

    // AI providerを取得
    const provider = createProviderFromEnv();

    // フォローアップ用のプロンプト（現在のスキーマを含む）
    const prompt = `現在のダッシュボードスキーマ:
\`\`\`json
${JSON.stringify(currentSchema, null, 2)}
\`\`\`

ユーザーの変更リクエスト: "${message}"

上記のスキーマを、ユーザーの変更リクエストに基づいて更新してください。`;

    // AI生成実行
    const schema = await provider.generateSchema(prompt, metadata);

    // 変更内容を検出（簡易版）
    const changes: SchemaChange[] = detectChanges(currentSchema, schema);

    const response: FollowUpResponse = {
      schema,
      changes,
      provider: provider.constructor.name,
      estimatedCost: 0, // TODO: プロバイダーからコスト情報を取得
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Follow-up generation error:", error);

    return NextResponse.json(
      {
        error: {
          code: "GENERATION_FAILED",
          message: error instanceof Error ? error.message : "Failed to update schema",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * スキーマの変更を検出
 */
function detectChanges(oldSchema: LiquidViewSchema, newSchema: LiquidViewSchema): SchemaChange[] {
  const changes: SchemaChange[] = [];

  // コンポーネントの変更を検出
  if (oldSchema.components.length !== newSchema.components.length) {
    if (newSchema.components.length > oldSchema.components.length) {
      changes.push({
        type: "component_add",
        description: `Added ${newSchema.components.length - oldSchema.components.length} component(s)`,
      });
    } else {
      changes.push({
        type: "component_delete",
        description: `Removed ${oldSchema.components.length - newSchema.components.length} component(s)`,
      });
    }
  }

  // コンポーネントの更新を検出（簡易版）
  oldSchema.components.forEach((oldComp, index) => {
    const newComp = newSchema.components[index];
    if (newComp && JSON.stringify(oldComp) !== JSON.stringify(newComp)) {
      changes.push({
        type: "component_update",
        componentId: (oldComp as any).id,
        from: oldComp,
        to: newComp,
        description: `Updated component`,
      });
    }
  });

  // レイアウトの変更を検出
  if (JSON.stringify(oldSchema.layout) !== JSON.stringify(newSchema.layout)) {
    changes.push({
      type: "layout_update",
      from: oldSchema.layout,
      to: newSchema.layout,
      description: "Updated layout",
    });
  }

  // DataSourceの変更を検出
  if (JSON.stringify(oldSchema.data_sources) !== JSON.stringify(newSchema.data_sources)) {
    changes.push({
      type: "data_source_update",
      from: oldSchema.data_sources,
      to: newSchema.data_sources,
      description: "Updated data sources",
    });
  }

  return changes;
}
