/**
 * VersionTimeline Component
 * バージョン履歴のタイムライン表示
 */

import React from "react";
import type { ArtifactVersion } from "@liqueur/artifact-store";

export interface VersionTimelineProps {
  /** バージョン一覧 */
  versions: ArtifactVersion[];
  /** 現在選択中のバージョン */
  currentVersion?: number;
  /** バージョンをクリックした時のコールバック */
  onVersionClick?: (version: number) => void;
  /** バージョンを復元する時のコールバック */
  onRestore?: (version: number) => void;
  /** バージョンを削除する時のコールバック */
  onDelete?: (version: number) => void;
}

/**
 * VersionTimeline - バージョン履歴タイムライン
 */
export const VersionTimeline: React.FC<VersionTimelineProps> = ({
  versions,
  currentVersion,
  onVersionClick,
  onRestore,
  onDelete,
}) => {
  if (versions.length === 0) {
    return (
      <div className="version-timeline-empty" data-testid="version-timeline-empty">
        <p>バージョン履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="version-timeline" data-testid="version-timeline">
      <div className="version-timeline-header">
        <h3>バージョン履歴</h3>
        <span className="version-count">{versions.length} versions</span>
      </div>

      <div className="version-timeline-list">
        {versions.map((version) => (
          <div
            key={version.version}
            className={`version-item ${
              currentVersion === version.version ? "version-item--current" : ""
            }`}
            data-testid={`version-item-${version.version}`}
            onClick={() => onVersionClick?.(version.version)}
          >
            <div className="version-item-header">
              <span className="version-number">v{version.version}</span>
              <span className="version-date">
                {new Date(version.createdAt).toLocaleString("ja-JP")}
              </span>
            </div>

            {version.message && (
              <p className="version-message" data-testid={`version-message-${version.version}`}>
                {version.message}
              </p>
            )}

            <div className="version-item-actions">
              {currentVersion !== version.version && onRestore && (
                <button
                  className="version-action-button version-action-button--restore"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`バージョン ${version.version} に復元しますか?`)) {
                      onRestore(version.version);
                    }
                  }}
                  data-testid={`version-restore-${version.version}`}
                >
                  復元
                </button>
              )}

              {versions.length > 1 && currentVersion !== version.version && onDelete && (
                <button
                  className="version-action-button version-action-button--delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`バージョン ${version.version} を削除しますか?`)) {
                      onDelete(version.version);
                    }
                  }}
                  data-testid={`version-delete-${version.version}`}
                >
                  削除
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
