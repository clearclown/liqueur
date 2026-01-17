/**
 * MessageList Component
 * メッセージ履歴表示
 */

import React, { useEffect, useRef } from "react";
import type { Message } from "../../types/chat";
import type { LiquidViewSchema } from "@liqueur/protocol";
import { MessageItem } from "./MessageItem";

export interface MessageListProps {
  /** メッセージリスト */
  messages: Message[];
  /** ローディング中かどうか */
  isLoading?: boolean;
  /** Artifactプレビューをクリックした時のコールバック */
  onArtifactClick?: (schema: LiquidViewSchema) => void;
  /** メッセージをコピーした時のコールバック */
  onCopy?: (message: Message) => void;
  /** メッセージを削除した時のコールバック */
  onDelete?: (messageId: string) => void;
}

/**
 * MessageList - メッセージ履歴表示コンポーネント
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  onArtifactClick,
  onCopy,
  onDelete,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    if (messagesEndRef.current?.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 空状態
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="message-list-empty" data-testid="message-list-empty">
        <div className="message-list-empty-content">
          <div className="message-list-empty-icon">💬</div>
          <h3 className="message-list-empty-title">
            チャットを開始してください
          </h3>
          <p className="message-list-empty-description">
            メッセージを入力して、AIにダッシュボードを生成させましょう。
          </p>
          <div className="message-list-empty-examples">
            <p className="message-list-empty-examples-title">例:</p>
            <ul className="message-list-empty-examples-list">
              <li>「月別の支出をバーチャートで表示して」</li>
              <li>「カテゴリ別の売上を円グラフにして」</li>
              <li>「過去6ヶ月のトレンドを折れ線グラフで」</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="message-list-container"
      data-testid="message-list-container"
      role="log"
      aria-live="polite"
      aria-label="メッセージ履歴"
    >
      <div className="message-list">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onArtifactClick={onArtifactClick}
            onCopy={onCopy}
            onDelete={onDelete}
          />
        ))}

        {/* タイピングインジケーター */}
        {isLoading && (
          <div className="message-typing" data-testid="message-typing">
            <div className="message-typing-avatar">AI</div>
            <div className="message-typing-indicator">
              <span className="message-typing-dot"></span>
              <span className="message-typing-dot"></span>
              <span className="message-typing-dot"></span>
            </div>
          </div>
        )}

        {/* スクロール用の参照点 */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
