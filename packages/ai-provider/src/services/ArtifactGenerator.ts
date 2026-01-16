/**
 * Artifact Generator Service
 * AIを使用してLiquidViewスキーマを生成
 */

import type { AIProvider, DatabaseMetadata } from "../types";
import type { LiquidViewSchema } from "@liqueur/protocol";
import { createDashboardPrompt, createSimpleDashboardPrompt } from "../prompts/dashboardPrompt";

/**
 * Artifact生成リクエスト
 */
export interface GenerateArtifactRequest {
  /** ユーザーのリクエスト（自然言語） */
  userRequest: string;

  /** データベースメタデータ（オプション） */
  metadata?: DatabaseMetadata;

  /** 既存のスキーマ（編集時） */
  existingSchema?: LiquidViewSchema;

  /** 最大トークン数 */
  maxTokens?: number;

  /** 温度パラメータ */
  temperature?: number;
}

/**
 * Artifact生成結果
 */
export interface GenerateArtifactResult {
  /** 生成されたスキーマ */
  schema: LiquidViewSchema;

  /** 生成に使用したプロンプト */
  prompt: string;

  /** AI応答の生テキスト */
  rawResponse: string;

  /** 推定コスト（USD） */
  estimatedCost?: number;
}

/**
 * ArtifactGenerator
 * AIプロバイダーを使用してLiquidViewスキーマを生成
 */
export class ArtifactGenerator {
  constructor(private provider: AIProvider) {}

  /**
   * ユーザーリクエストからArtifactを生成
   */
  async generateArtifact(
    request: GenerateArtifactRequest
  ): Promise<GenerateArtifactResult> {
    // プロンプト生成
    const prompt = request.metadata
      ? createDashboardPrompt(request.userRequest, request.metadata)
      : createSimpleDashboardPrompt(request.userRequest);

    // AI呼び出し（generateSchemaメソッドを使用）
    const schema = await this.provider.generateSchema(
      prompt,
      request.metadata || { tables: [] }
    );

    // コスト推定
    const costEstimate = this.provider.estimateCost(prompt);

    return {
      schema,
      prompt,
      rawResponse: JSON.stringify(schema),
      estimatedCost: costEstimate.estimatedCost,
    };
  }

  /**
   * AI応答からJSONを抽出
   */
  private extractJSON(text: string): LiquidViewSchema {
    // マークダウンコードブロックを削除
    let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    // 前後の空白を削除
    cleaned = cleaned.trim();

    // JSONのみ抽出（最初の{から最後の}まで）
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response");
    }

    try {
      const schema = JSON.parse(jsonMatch[0]) as LiquidViewSchema;

      // 基本的な検証
      if (!schema.version || !schema.layout || !schema.components) {
        throw new Error("Invalid LiquidViewSchema structure");
      }

      return schema;
    } catch (error) {
      throw new Error(
        `Failed to parse AI response as JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * トークン数からコストを推定
   * （DeepSeekの料金: $0.27/1M input tokens, $1.10/1M output tokens）
   */
  private estimateCost(totalTokens: number): number {
    // 簡易的な推定（入力:出力 = 3:1 と仮定）
    const inputTokens = totalTokens * 0.75;
    const outputTokens = totalTokens * 0.25;

    const inputCost = (inputTokens / 1_000_000) * 0.27;
    const outputCost = (outputTokens / 1_000_000) * 1.1;

    return inputCost + outputCost;
  }

  /**
   * 既存のスキーマを編集
   */
  async editArtifact(
    existingSchema: LiquidViewSchema,
    editRequest: string,
    metadata?: DatabaseMetadata
  ): Promise<GenerateArtifactResult> {
    const prompt = this.createEditPrompt(
      existingSchema,
      editRequest,
      metadata
    );

    // AI呼び出し
    const schema = await this.provider.generateSchema(
      prompt,
      metadata || { tables: [] }
    );

    // コスト推定
    const costEstimate = this.provider.estimateCost(prompt);

    return {
      schema,
      prompt,
      rawResponse: JSON.stringify(schema),
      estimatedCost: costEstimate.estimatedCost,
    };
  }

  /**
   * 編集プロンプトを作成
   */
  private createEditPrompt(
    existingSchema: LiquidViewSchema,
    editRequest: string,
    metadata?: DatabaseMetadata
  ): string {
    const metadataInfo = metadata
      ? `\n**Available Tables:**\n${metadata.tables.map((t) => `- ${t.name}: ${t.columns.map((c) => c.name).join(", ")}`).join("\n")}`
      : "";

    return `You are editing an existing dashboard schema. Make the requested changes and output the COMPLETE updated JSON schema.

**Current Schema:**
${JSON.stringify(existingSchema, null, 2)}
${metadataInfo}

**Edit Request:**
${editRequest}

**Rules:**
1. Output ONLY the complete updated JSON schema
2. Preserve existing components unless explicitly asked to remove them
3. Use only valid LiquidViewSchema structure

Generate the updated JSON now:`;
  }
}
