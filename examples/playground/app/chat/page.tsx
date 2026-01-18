/**
 * Chat Demo Page
 * チャットUIデモページ（Phase 3）
 */

"use client";

import React, { useState } from "react";
import { ChatContainer, LiquidRenderer, useConversation } from "@liqueur/react";
import type { LiquidViewSchema } from "@liqueur/protocol";
import type { DatabaseMetadata } from "@liqueur/ai-provider";

/**
 * モックのデータベースメタデータ
 */
const mockMetadata: DatabaseMetadata = {
  tables: [
    {
      name: "expenses",
      description: "Expense transactions",
      columns: [
        { name: "id", type: "integer", nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: "category", type: "text", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "amount", type: "decimal", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "date", type: "date", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "description", type: "text", nullable: true, isPrimaryKey: false, isForeignKey: false },
      ],
    },
    {
      name: "sales",
      description: "Sales transactions",
      columns: [
        { name: "id", type: "integer", nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: "product", type: "text", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "revenue", type: "decimal", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "quantity", type: "integer", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "date", type: "date", nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
  ],
};

/**
 * モックデータ（チャート表示用）
 */
const mockData = {
  expenses: [
    { category: "食費", amount: 45000, date: "2024-01" },
    { category: "交通費", amount: 12000, date: "2024-01" },
    { category: "光熱費", amount: 8000, date: "2024-01" },
    { category: "旅行", amount: 50000, date: "2024-01" },
  ],
  sales: [
    { product: "Product A", revenue: 120000, quantity: 50, date: "2024-01" },
    { product: "Product B", revenue: 80000, quantity: 30, date: "2024-01" },
    { product: "Product C", revenue: 60000, quantity: 20, date: "2024-01" },
  ],
};

/**
 * Chat Demo Page Component
 */
export default function ChatDemoPage() {
  const [selectedSchema, setSelectedSchema] = useState<LiquidViewSchema | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  const {
    messages,
    currentArtifact,
    sendMessage,
    clear,
    isLoading,
    error,
  } = useConversation({
    metadata: mockMetadata,
  });

  const handleArtifactClick = (schema: LiquidViewSchema) => {
    setSelectedSchema(schema);
    setIsPreviewExpanded(true);
  };

  const handleCopyMessage = (message: any) => {
    navigator.clipboard.writeText(message.content);
  };

  const displaySchema = selectedSchema || currentArtifact;

  return (
    <div className="chat-demo-page">
      <div className="chat-demo-container">
        {/* 左側: チャットUI */}
        <div className="chat-demo-chat-section">
          <ChatContainer
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            error={error}
            onArtifactClick={handleArtifactClick}
            onCopyMessage={handleCopyMessage}
            onClearConversation={clear}
          />
        </div>

        {/* 右側: ライブプレビュー */}
        <div className={`chat-demo-preview-section ${isPreviewExpanded ? "expanded" : ""}`}>
          <div className="chat-demo-preview-header">
            <h3 className="chat-demo-preview-title">
              {displaySchema ? "ライブプレビュー" : "プレビューなし"}
            </h3>

            {displaySchema && (
              <div className="chat-demo-preview-actions">
                <button
                  type="button"
                  onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                  className="chat-demo-preview-toggle"
                >
                  {isPreviewExpanded ? "縮小" : "拡大"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSchema(null)}
                  className="chat-demo-preview-close"
                >
                  閉じる
                </button>
              </div>
            )}
          </div>

          <div className="chat-demo-preview-content">
            {displaySchema ? (
              <LiquidRenderer schema={displaySchema} data={mockData} />
            ) : (
              <div className="chat-demo-preview-empty">
                <p>チャットでダッシュボードを生成するとここに表示されます。</p>
                <div className="chat-demo-preview-examples">
                  <p>試してみましょう:</p>
                  <ul>
                    <li>「月別の支出をバーチャートで表示して」</li>
                    <li>「円グラフにして」（フォローアップ）</li>
                    <li>「旅行カテゴリを除外して」（フォローアップ）</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .chat-demo-page {
          min-height: 100vh;
          background: #f5f5f5;
          padding: 20px;
        }

        .chat-demo-container {
          max-width: 1600px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          height: calc(100vh - 40px);
        }

        .chat-demo-chat-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .chat-demo-preview-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-demo-preview-section.expanded {
          grid-column: 1 / -1;
        }

        .chat-demo-preview-header {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-demo-preview-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .chat-demo-preview-actions {
          display: flex;
          gap: 8px;
        }

        .chat-demo-preview-toggle,
        .chat-demo-preview-close {
          padding: 8px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 14px;
        }

        .chat-demo-preview-toggle:hover,
        .chat-demo-preview-close:hover {
          background: #f5f5f5;
        }

        .chat-demo-preview-content {
          flex: 1;
          overflow: auto;
          padding: 16px;
        }

        .chat-demo-preview-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
          text-align: center;
        }

        .chat-demo-preview-examples {
          margin-top: 24px;
          text-align: left;
        }

        .chat-demo-preview-examples ul {
          list-style: none;
          padding: 0;
        }

        .chat-demo-preview-examples li {
          padding: 8px;
          background: #f5f5f5;
          margin: 4px 0;
          border-radius: 4px;
        }

        @media (max-width: 1024px) {
          .chat-demo-container {
            grid-template-columns: 1fr;
          }

          .chat-demo-preview-section {
            display: none;
          }

          .chat-demo-preview-section.expanded {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
}
