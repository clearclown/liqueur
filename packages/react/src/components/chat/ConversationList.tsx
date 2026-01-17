/**
 * ConversationList Component
 * 会話一覧を表示するサイドバー
 */

import React from "react";

export interface ConversationListProps {
  /** 会話一覧 */
  conversations: ConversationSummary[];
  /** 現在選択中の会話ID */
  currentConversationId?: string;
  /** 会話を選択した時のコールバック */
  onSelectConversation: (conversationId: string) => void;
  /** 新規会話作成時のコールバック */
  onNewConversation: () => void;
  /** 会話削除時のコールバック */
  onDeleteConversation?: (conversationId: string) => void;
  /** ローディング中かどうか */
  isLoading?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * 会話サマリー（一覧表示用の簡易版）
 */
export interface ConversationSummary {
  /** 会話ID */
  id: string;
  /** タイトル（最初のメッセージから生成） */
  title: string;
  /** 更新日時 */
  updatedAt: Date;
  /** メッセージ数 */
  messageCount: number;
  /** Artifact数 */
  artifactCount?: number;
}

/**
 * ConversationList - 会話一覧コンポーネント
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isLoading = false,
  className = "",
}) => {
  const handleDelete = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (
      onDeleteConversation &&
      confirm("この会話を削除しますか？この操作は取り消せません。")
    ) {
      onDeleteConversation(conversationId);
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;

    return d.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`conversation-list ${className}`}
      data-testid="conversation-list"
    >
      {/* ヘッダー */}
      <div className="conversation-list-header" data-testid="conversation-list-header">
        <h3 className="conversation-list-title">会話履歴</h3>
        <button
          type="button"
          onClick={onNewConversation}
          className="conversation-list-new-button"
          data-testid="conversation-list-new-button"
          aria-label="新しい会話を開始"
          disabled={isLoading}
        >
          + 新規
        </button>
      </div>

      {/* 会話一覧 */}
      <div className="conversation-list-items" data-testid="conversation-list-items">
        {isLoading ? (
          <div
            className="conversation-list-loading"
            data-testid="conversation-list-loading"
          >
            読み込み中...
          </div>
        ) : conversations.length === 0 ? (
          <div
            className="conversation-list-empty"
            data-testid="conversation-list-empty"
          >
            <p>会話履歴がありません</p>
            <p className="conversation-list-empty-hint">
              「新規」をクリックして会話を開始しましょう
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-list-item ${
                currentConversationId === conversation.id
                  ? "conversation-list-item--active"
                  : ""
              }`}
              data-testid={`conversation-item-${conversation.id}`}
              onClick={() => onSelectConversation(conversation.id)}
              role="button"
              tabIndex={0}
              aria-current={
                currentConversationId === conversation.id ? "true" : undefined
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSelectConversation(conversation.id);
                }
              }}
            >
              <div className="conversation-list-item-content">
                <div className="conversation-list-item-title">
                  {conversation.title || "無題の会話"}
                </div>
                <div className="conversation-list-item-meta">
                  <span className="conversation-list-item-date">
                    {formatDate(conversation.updatedAt)}
                  </span>
                  <span className="conversation-list-item-count">
                    {conversation.messageCount}件
                  </span>
                  {conversation.artifactCount !== undefined &&
                    conversation.artifactCount > 0 && (
                      <span className="conversation-list-item-artifacts">
                        📊 {conversation.artifactCount}
                      </span>
                    )}
                </div>
              </div>

              {onDeleteConversation && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, conversation.id)}
                  className="conversation-list-item-delete"
                  data-testid={`conversation-delete-${conversation.id}`}
                  aria-label={`会話「${conversation.title}」を削除`}
                >
                  ×
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
