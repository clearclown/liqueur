/**
 * ChatContainer Component
 * チャット全体のコンテナ
 */

import React from "react";
import type { Message } from "../../types/chat";
import type { LiquidViewSchema } from "@liqueur/protocol";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export interface ChatContainerProps {
  /** メッセージリスト */
  messages: Message[];
  /** メッセージ送信時のコールバック */
  onSendMessage: (message: string) => void;
  /** ローディング中かどうか */
  isLoading?: boolean;
  /** エラーメッセージ */
  error?: string | null;
  /** Artifactプレビューをクリックした時のコールバック */
  onArtifactClick?: (schema: LiquidViewSchema) => void;
  /** メッセージをコピーした時のコールバック */
  onCopyMessage?: (message: Message) => void;
  /** メッセージを削除した時のコールバック */
  onDeleteMessage?: (messageId: string) => void;
  /** 会話をクリアした時のコールバック */
  onClearConversation?: () => void;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * ChatContainer - チャット全体のコンテナコンポーネント
 */
export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  error = null,
  onArtifactClick,
  onCopyMessage,
  onDeleteMessage,
  onClearConversation,
  className = "",
}) => {
  const handleClearConversation = () => {
    if (
      messages.length > 0 &&
      confirm("会話履歴をすべて削除しますか？この操作は取り消せません。")
    ) {
      onClearConversation?.();
    }
  };

  return (
    <div
      className={`chat-container ${className}`}
      data-testid="chat-container"
    >
      {/* チャットヘッダー */}
      <div className="chat-header" data-testid="chat-header">
        <div className="chat-header-title">
          <h2 className="chat-title">AI ダッシュボード生成</h2>
          <p className="chat-subtitle">
            自然言語でダッシュボードを生成・編集できます
          </p>
        </div>

        <div className="chat-header-actions">
          {messages.length > 0 && onClearConversation && (
            <button
              type="button"
              onClick={handleClearConversation}
              className="chat-clear-button"
              data-testid="chat-clear-button"
              aria-label="会話をクリア"
            >
              🗑️ クリア
            </button>
          )}
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="chat-error" data-testid="chat-error" role="alert">
          <span className="chat-error-icon">⚠️</span>
          <span className="chat-error-message">{error}</span>
        </div>
      )}

      {/* メッセージリスト */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onArtifactClick={onArtifactClick}
        onCopy={onCopyMessage}
        onDelete={onDeleteMessage}
      />

      {/* 入力欄 */}
      <ChatInput onSend={onSendMessage} isLoading={isLoading} />
    </div>
  );
};
