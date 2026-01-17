/**
 * VersionDiff Component
 * バージョン間の差分表示
 */

import React from "react";
import type { VersionDiff as VersionDiffType } from "@liqueur/artifact-store";

export interface VersionDiffProps {
  /** 差分データ */
  diff: VersionDiffType;
  /** フルJSON表示モード */
  showFullJson?: boolean;
}

/**
 * VersionDiff - バージョン差分表示コンポーネント
 */
export const VersionDiff: React.FC<VersionDiffProps> = ({ diff, showFullJson = false }) => {
  if (diff.changes.length === 0) {
    return (
      <div className="version-diff-empty" data-testid="version-diff-empty">
        <p>変更はありません</p>
      </div>
    );
  }

  return (
    <div className="version-diff" data-testid="version-diff">
      <div className="version-diff-header">
        <h3>
          変更内容: v{diff.fromVersion} → v{diff.toVersion}
        </h3>
        <span className="change-count">{diff.changes.length} changes</span>
      </div>

      <div className="version-diff-changes">
        {diff.changes.map((change, index) => (
          <div
            key={index}
            className={`diff-change diff-change--${change.type}`}
            data-testid={`diff-change-${index}`}
          >
            <div className="diff-change-header">
              <span className={`diff-type diff-type--${change.type}`}>
                {change.type === "add" && "+ 追加"}
                {change.type === "remove" && "- 削除"}
                {change.type === "modify" && "~ 変更"}
              </span>
              <code className="diff-path">{change.path}</code>
            </div>

            {change.description && (
              <p className="diff-description">{change.description}</p>
            )}

            {showFullJson && (
              <div className="diff-values">
                {change.oldValue !== undefined && (
                  <div className="diff-value diff-value--old">
                    <span className="diff-value-label">旧:</span>
                    <pre data-testid={`diff-old-${index}`}>
                      {JSON.stringify(change.oldValue, null, 2)}
                    </pre>
                  </div>
                )}

                {change.newValue !== undefined && (
                  <div className="diff-value diff-value--new">
                    <span className="diff-value-label">新:</span>
                    <pre data-testid={`diff-new-${index}`}>
                      {JSON.stringify(change.newValue, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
