/**
 * Chat UI Type Definitions
 * Phase 3: チャットUI & 対話型改善
 */

import type { LiquidViewSchema } from "@liqueur/protocol";

/**
 * メッセージの役割
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * メッセージの状態
 */
export type MessageStatus = "sending" | "sent" | "error";

/**
 * チャットメッセージ
 */
export interface Message {
  /** メッセージID */
  id: string;
  /** 役割（ユーザー/AI/システム） */
  role: MessageRole;
  /** メッセージ内容 */
  content: string;
  /** 生成されたArtifactのID（AIメッセージのみ） */
  artifactId?: string;
  /** 生成されたスキーマ（AIメッセージのみ） */
  schema?: LiquidViewSchema;
  /** タイムスタンプ */
  timestamp: Date;
  /** メッセージの状態 */
  status?: MessageStatus;
  /** エラーメッセージ */
  error?: string;
}

/**
 * 会話（複数のメッセージをグループ化）
 */
export interface Conversation {
  /** 会話ID */
  id: string;
  /** タイトル */
  title?: string;
  /** メッセージリスト */
  messages: Message[];
  /** 現在のArtifact ID */
  currentArtifactId?: string;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * Artifactバージョン
 */
export interface ArtifactVersion {
  /** バージョンID */
  id: string;
  /** Artifact ID */
  artifactId: string;
  /** スキーマ */
  schema: LiquidViewSchema;
  /** 生成に使用したプロンプト */
  prompt: string;
  /** バージョン番号 */
  version: number;
  /** 作成日時 */
  createdAt: Date;
  /** 変更内容の説明 */
  changeDescription?: string;
}

/**
 * スキーマの変更内容
 */
export interface SchemaChange {
  /** 変更タイプ */
  type: "component_add" | "component_update" | "component_delete" | "data_source_update" | "layout_update";
  /** 対象コンポーネントID */
  componentId?: string;
  /** 変更前の値 */
  from?: any;
  /** 変更後の値 */
  to?: any;
  /** 変更の説明 */
  description?: string;
}

/**
 * Follow-up APIリクエスト
 */
export interface FollowUpRequest {
  /** 会話ID */
  conversationId: string;
  /** フォローアップメッセージ */
  message: string;
  /** 現在のスキーマ */
  currentSchema: LiquidViewSchema;
  /** データベースメタデータ */
  metadata: any;
}

/**
 * Follow-up APIレスポンス
 */
export interface FollowUpResponse {
  /** 更新されたスキーマ */
  schema: LiquidViewSchema;
  /** 変更内容 */
  changes: SchemaChange[];
  /** AI provider情報 */
  provider?: string;
  /** コスト推定 */
  estimatedCost?: number;
}
