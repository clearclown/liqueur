/**
 * Demo Page - Phase 3/4統合デモ
 * 3カラムレイアウト: 会話一覧 | チャット | プレビュー+バージョン履歴
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import type { LiquidViewSchema } from "@liqueur/protocol";
import type { DatabaseMetadata } from "@liqueur/ai-provider";
import {
  LiquidRenderer,
  ChatContainer,
  ConversationList,
  VersionTimeline,
} from "@liqueur/react";
import { useConversation } from "@liqueur/react";
import type { ConversationSummary } from "@liqueur/react";
import type { ArtifactVersion } from "@liqueur/artifact-store";
import "./demo.css";

/**
 * モックのデータベースメタデータ
 */
const mockMetadata: DatabaseMetadata = {
  tables: [
    {
      name: "expenses",
      description: "Expense transactions",
      columns: [
        {
          name: "id",
          type: "integer",
          nullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
        },
        {
          name: "category",
          type: "text",
          nullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
        },
        {
          name: "amount",
          type: "decimal",
          nullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
        },
        {
          name: "date",
          type: "date",
          nullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
        },
      ],
    },
    {
      name: "sales",
      description: "Sales records",
      columns: [
        {
          name: "id",
          type: "integer",
          nullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
        },
        {
          name: "product",
          type: "text",
          nullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
        },
        {
          name: "revenue",
          type: "decimal",
          nullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
        },
        {
          name: "month",
          type: "text",
          nullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
        },
      ],
    },
  ],
};

/**
 * モックの会話一覧
 */
const initialConversations: ConversationSummary[] = [];

export default function DemoPage() {
  // 会話一覧の状態
  const [conversations, setConversations] =
    useState<ConversationSummary[]>(initialConversations);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(undefined);

  // 会話フック
  const {
    messages,
    currentArtifact,
    sendMessage,
    clear,
    isLoading,
    error,
  } = useConversation({
    conversationId: currentConversationId,
    metadata: mockMetadata,
  });

  // バージョン履歴の状態（モック）
  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number | undefined>(
    undefined
  );

  // 選択中のArtifact（プレビュー表示用）
  const [selectedArtifact, setSelectedArtifact] =
    useState<LiquidViewSchema | null>(null);

  // currentArtifactが変わったらselectedArtifactも更新
  useEffect(() => {
    if (currentArtifact) {
      setSelectedArtifact(currentArtifact);
      // バージョン履歴を更新（実際のAPIでは/api/liquid/artifacts/:id/versionsから取得）
      const newVersion: ArtifactVersion = {
        schema: currentArtifact,
        version: versions.length + 1,
        message: messages[messages.length - 1]?.content || "",
        createdAt: new Date(),
        authorId: "user-demo",
      };
      setVersions((prev) => [...prev, newVersion]);
      setCurrentVersion(newVersion.version);
    }
  }, [currentArtifact]);

  /**
   * 新しい会話を開始
   */
  const handleNewConversation = useCallback(() => {
    const newId = `conv-${Date.now()}`;
    setCurrentConversationId(newId);
    clear();
    setVersions([]);
    setCurrentVersion(undefined);
    setSelectedArtifact(null);
  }, [clear]);

  /**
   * 会話を選択
   */
  const handleSelectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    // TODO: 会話履歴をAPIから取得
  }, []);

  /**
   * 会話を削除
   */
  const handleDeleteConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.filter((conv) => conv.id !== conversationId)
    );
    if (currentConversationId === conversationId) {
      setCurrentConversationId(undefined);
      clear();
    }
  }, [currentConversationId, clear]);

  /**
   * メッセージを送信
   */
  const handleSendMessage = useCallback(
    async (message: string) => {
      // 会話が開始されていなければ新規作成
      if (!currentConversationId) {
        const newId = `conv-${Date.now()}`;
        setCurrentConversationId(newId);

        // 会話一覧に追加
        const newConversation: ConversationSummary = {
          id: newId,
          title: message.slice(0, 30) + (message.length > 30 ? "..." : ""),
          updatedAt: new Date(),
          messageCount: 1,
          artifactCount: 0,
        };
        setConversations((prev) => [newConversation, ...prev]);
      }

      await sendMessage(message);

      // 会話一覧を更新
      if (currentConversationId) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? {
                  ...conv,
                  updatedAt: new Date(),
                  messageCount: messages.length + 2, // user + assistant
                  artifactCount: (conv.artifactCount || 0) + 1,
                }
              : conv
          )
        );
      }
    },
    [currentConversationId, sendMessage, messages.length]
  );

  /**
   * 会話をクリア
   */
  const handleClearConversation = useCallback(() => {
    clear();
    setVersions([]);
    setCurrentVersion(undefined);
    setSelectedArtifact(null);
  }, [clear]);

  /**
   * Artifactプレビューをクリック
   */
  const handleArtifactClick = useCallback((schema: LiquidViewSchema) => {
    setSelectedArtifact(schema);
  }, []);

  /**
   * バージョンを選択
   */
  const handleVersionClick = useCallback(
    (version: number) => {
      const selectedVersion = versions.find((v) => v.version === version);
      if (selectedVersion) {
        setCurrentVersion(version);
        setSelectedArtifact(selectedVersion.schema);
      }
    },
    [versions]
  );

  /**
   * バージョンを復元
   */
  const handleVersionRestore = useCallback(
    (version: number) => {
      const selectedVersion = versions.find((v) => v.version === version);
      if (selectedVersion) {
        // 新しいバージョンとして復元
        const restoredVersion: ArtifactVersion = {
          schema: selectedVersion.schema,
          version: versions.length + 1,
          message: `v${version}から復元`,
          createdAt: new Date(),
          authorId: "user-demo",
        };
        setVersions((prev) => [...prev, restoredVersion]);
        setCurrentVersion(restoredVersion.version);
        setSelectedArtifact(selectedVersion.schema);
      }
    },
    [versions]
  );

  return (
    <div className="demo-page">
      {/* ヘッダー */}
      <header className="demo-header">
        <h1 className="demo-title">Project Liquid Demo</h1>
        <p className="demo-subtitle">
          AI-Powered Dashboard Generation with Conversational UI
        </p>
      </header>

      {/* メインコンテンツ - 3カラムレイアウト */}
      <main className="demo-main">
        {/* 左カラム: 会話一覧 */}
        <aside className="demo-sidebar demo-sidebar--left">
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </aside>

        {/* 中央カラム: チャット */}
        <section className="demo-chat">
          <ChatContainer
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            error={error}
            onArtifactClick={handleArtifactClick}
            onClearConversation={handleClearConversation}
          />
        </section>

        {/* 右カラム: プレビュー + バージョン履歴 */}
        <aside className="demo-sidebar demo-sidebar--right">
          {/* Artifactプレビュー */}
          <div className="demo-preview">
            <div className="demo-preview-header">
              <h3>Live Preview</h3>
            </div>
            <div className="demo-preview-content">
              {selectedArtifact ? (
                <LiquidRenderer schema={selectedArtifact} />
              ) : (
                <div className="demo-preview-empty">
                  <p>プレビューがありません</p>
                  <p className="demo-preview-hint">
                    チャットでダッシュボードを生成してください
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* バージョン履歴 */}
          <div className="demo-versions">
            <VersionTimeline
              versions={versions}
              currentVersion={currentVersion}
              onVersionClick={handleVersionClick}
              onRestore={handleVersionRestore}
            />
          </div>
        </aside>
      </main>
    </div>
  );
}
