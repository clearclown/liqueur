/**
 * Follow-up API Route
 * フォローアップメッセージによるスキーマ更新
 *
 * POST /api/liquid/follow-up
 */

import { NextRequest, NextResponse } from "next/server";
import type { LiquidViewSchema } from "@liqueur/protocol";
import type { DatabaseMetadata } from "@liqueur/ai-provider";
import { ProviderFactory } from "@liqueur/ai-provider";
import { validateString, applyRateLimit } from "@/lib/apiHelpers";

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
    const rateLimitResult = await applyRateLimit(request, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: `Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.reset! / 1000)}s`,
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

    const messageValidation = validateString(message, 1, 5000);
    if (!messageValidation.valid) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_MESSAGE",
            message: messageValidation.error,
          },
        },
        { status: 400 }
      );
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
    const providerFactory = new ProviderFactory();
    const provider = providerFactory.createProvider();

    // フォローアップ用のシステムプロンプト
    const systemPrompt = `あなたはダッシュボード更新アシスタントです。
ユーザーのフォローアップメッセージに基づいて、既存のLiquidViewSchemaを更新してください。

重要な指示:
1. **既存のスキーマを基に変更のみを適用する**
2. ユーザーが明示的に変更を求めていない部分は保持する
3. JSONスキーマのみを出力し、説明文は含めない
4. 有効なLiquidViewSchema形式であることを確認する

現在のスキーマ:
\`\`\`json
${JSON.stringify(currentSchema, null, 2)}
\`\`\`

ユーザーのフォローアップ: "${message}"

更新されたスキーマをJSON形式で出力してください。`;

    // AI生成実行
    const result = await provider.generateSchema({
      prompt: systemPrompt,
      metadata,
      systemPrompt: "You are a dashboard schema updater. Output only valid JSON, no explanations.",
    });

    // 変更内容を検出（簡易版）
    const changes: SchemaChange[] = detectChanges(currentSchema, result.schema);

    const response: FollowUpResponse = {
      schema: result.schema,
      changes,
      provider: result.metadata.provider,
      estimatedCost: result.metadata.estimatedCost,
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
