/**
 * MessageItem Component
 * 個別メッセージ表示
 */

import React, { useState } from "react";
import type { Message } from "../../types/chat";
import type { LiquidViewSchema } from "@liqueur/protocol";

export interface MessageItemProps {
  /** メッセージデータ */
  message: Message;
  /** Artifactプレビューをクリックした時のコールバック */
  onArtifactClick?: (schema: LiquidViewSchema) => void;
  /** メッセージをコピーした時のコールバック */
  onCopy?: (message: Message) => void;
  /** メッセージを削除した時のコールバック */
  onDelete?: (messageId: string) => void;
}

/**
 * MessageItem - 個別メッセージ表示コンポーネント
 */
export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onArtifactClick,
  onCopy,
  onDelete,
}) => {
  const [isArtifactExpanded, setIsArtifactExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    onCopy?.(message);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDelete = () => {
    if (confirm("このメッセージを削除しますか？")) {
      onDelete?.(message.id);
    }
  };

  const handleArtifactClick = () => {
    if (message.schema) {
      onArtifactClick?.(message.schema);
    }
  };

  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const hasArtifact = !!message.schema;

  return (
    <div
      className={`message-item message-item--${message.role}`}
      data-testid={`message-item-${message.role}`}
      data-message-id={message.id}
    >
      {/* メッセージヘッダー */}
      <div className="message-header">
        <div className="message-meta">
          <span className="message-role" data-testid="message-role">
            {isUser ? "あなた" : isSystem ? "システム" : "AI"}
          </span>
          <span className="message-timestamp" data-testid="message-timestamp">
            {message.timestamp.toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* アクションボタン */}
        <div className="message-actions">
          {onCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className="message-action-button"
              data-testid="message-copy-button"
              aria-label="メッセージをコピー"
              title="メッセージをコピー"
            >
              {isCopied ? "✓" : "📋"}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="message-action-button"
              data-testid="message-delete-button"
              aria-label="メッセージを削除"
              title="メッセージを削除"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* メッセージ本文 */}
      <div className="message-content" data-testid="message-content">
        <p className="message-text">{message.content}</p>
      </div>

      {/* エラー表示 */}
      {message.status === "error" && message.error && (
        <div className="message-error" data-testid="message-error">
          <span className="message-error-icon">⚠️</span>
          <span className="message-error-text">{message.error}</span>
        </div>
      )}

      {/* Artifactプレビュー */}
      {hasArtifact && (
        <div className="message-artifact" data-testid="message-artifact">
          <div className="message-artifact-header">
            <button
              type="button"
              onClick={() => setIsArtifactExpanded(!isArtifactExpanded)}
              className="message-artifact-toggle"
              data-testid="message-artifact-toggle"
              aria-expanded={isArtifactExpanded}
              aria-label="Artifactを表示/非表示"
            >
              <span className="message-artifact-icon">
                {isArtifactExpanded ? "▼" : "▶"}
              </span>
              <span className="message-artifact-label">
                生成されたダッシュボード
              </span>
            </button>

            {message.artifactId && (
              <span
                className="message-artifact-id"
                data-testid="message-artifact-id"
              >
                ID: {message.artifactId.slice(0, 8)}
              </span>
            )}
          </div>

          {isArtifactExpanded && (
            <div
              className="message-artifact-preview"
              data-testid="message-artifact-preview"
            >
              <button
                type="button"
                onClick={handleArtifactClick}
                className="message-artifact-view-button"
                data-testid="message-artifact-view-button"
              >
                フルサイズで表示
              </button>

              {/* スキーマのプレビュー（JSON） */}
              <details className="message-artifact-schema">
                <summary>スキーマを表示</summary>
                <pre
                  className="message-artifact-json"
                  data-testid="message-artifact-json"
                >
                  {JSON.stringify(message.schema, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* ローディングインジケーター */}
      {message.status === "sending" && (
        <div className="message-loading" data-testid="message-loading">
          <span className="message-loading-text">送信中...</span>
        </div>
      )}
    </div>
  );
};
