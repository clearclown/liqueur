/**
 * ArtifactPreview Component
 * Artifact（生成されたスキーマ）のプレビュー表示
 */

import React, { useState } from "react";
import type { LiquidViewSchema } from "@liqueur/protocol";
import { LiquidRenderer } from "../LiquidRenderer";

export interface ArtifactPreviewProps {
  /** 表示するスキーマ */
  schema: LiquidViewSchema;
  /** 折りたたみ状態の初期値 */
  defaultCollapsed?: boolean;
  /** クリック時のコールバック */
  onClick?: (schema: LiquidViewSchema) => void;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * ArtifactPreview - メッセージ内のArtifactプレビュー
 */
export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({
  schema,
  defaultCollapsed = false,
  onClick,
  className = "",
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(schema);
    }
  };

  return (
    <div
      className={`artifact-preview ${className}`}
      data-testid="artifact-preview"
    >
      {/* ヘッダー */}
      <div className="artifact-preview-header" data-testid="artifact-preview-header">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="artifact-preview-toggle"
          data-testid="artifact-preview-toggle"
          aria-label={collapsed ? "展開" : "折りたたみ"}
          aria-expanded={!collapsed}
        >
          <span className="artifact-preview-icon">
            {collapsed ? "▶" : "▼"}
          </span>
          <span className="artifact-preview-title">
            生成されたダッシュボード
          </span>
        </button>

        {onClick && (
          <button
            type="button"
            onClick={handleClick}
            className="artifact-preview-open-button"
            data-testid="artifact-preview-open-button"
            aria-label="別ウィンドウで開く"
          >
            🔍 詳細を見る
          </button>
        )}
      </div>

      {/* コンテンツ */}
      {!collapsed && (
        <div
          className="artifact-preview-content"
          data-testid="artifact-preview-content"
        >
          <div className="artifact-preview-renderer">
            <LiquidRenderer schema={schema} />
          </div>

          {/* スキーマ情報 */}
          <div className="artifact-preview-meta" data-testid="artifact-preview-meta">
            <div className="artifact-preview-meta-item">
              <span className="artifact-preview-meta-label">Components:</span>
              <span className="artifact-preview-meta-value">
                {schema.components.length}
              </span>
            </div>
            <div className="artifact-preview-meta-item">
              <span className="artifact-preview-meta-label">Data Sources:</span>
              <span className="artifact-preview-meta-value">
                {Object.keys(schema.data_sources || {}).length}
              </span>
            </div>
            <div className="artifact-preview-meta-item">
              <span className="artifact-preview-meta-label">Layout:</span>
              <span className="artifact-preview-meta-value">
                {schema.layout.type}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
