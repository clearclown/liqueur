import React from "react";
import type { Dashboard } from "../../types";

/**
 * DashboardCard props
 * ダッシュボードカードプロパティ
 */
export interface DashboardCardProps {
  /** Dashboard data */
  dashboard: Dashboard;

  /** Called when card is clicked */
  onSelect?: (dashboard: Dashboard) => void;

  /** Called when favorite button is clicked */
  onFavoriteToggle?: (id: string) => void;

  /** Called when edit button is clicked */
  onEdit?: (dashboard: Dashboard) => void;

  /** Called when delete button is clicked */
  onDelete?: (id: string) => void;

  /** Additional class name */
  className?: string;
}

/**
 * Format date to locale string
 * 日付をロケール文字列にフォーマット
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * DashboardCard component
 * ダッシュボードカードコンポーネント
 *
 * Displays a dashboard as a card with title, description, metadata, and actions.
 * ダッシュボードをカード形式で表示（タイトル、説明、メタデータ、アクション）
 *
 * @example
 * ```tsx
 * <DashboardCard
 *   dashboard={dashboard}
 *   onSelect={(d) => console.log("Selected:", d.id)}
 *   onFavoriteToggle={(id) => console.log("Toggle favorite:", id)}
 *   onEdit={(d) => console.log("Edit:", d.id)}
 *   onDelete={(id) => console.log("Delete:", id)}
 * />
 * ```
 */
export function DashboardCard({
  dashboard,
  onSelect,
  onFavoriteToggle,
  onEdit,
  onDelete,
  className = "",
}: DashboardCardProps): JSX.Element {
  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    // Don't trigger onSelect if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest && target.closest("button")) {
      return;
    }
    onSelect?.(dashboard);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(dashboard.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(dashboard);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(dashboard.id);
  };

  return (
    <article
      className={`dashboard-card ${className}`}
      onClick={handleCardClick}
      aria-label={`Dashboard: ${dashboard.title}`}
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "16px",
        cursor: onSelect ? "pointer" : "default",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
        if (onSelect) {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
        }
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>{dashboard.title}</h3>
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={dashboard.favorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={dashboard.favorite}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
            padding: "4px",
          }}
        >
          {dashboard.favorite ? "★" : "☆"}
        </button>
      </div>

      {/* Description */}
      {dashboard.description && (
        <p style={{ margin: "8px 0", color: "#666", fontSize: "14px" }}>{dashboard.description}</p>
      )}

      {/* Tags */}
      {dashboard.tags && dashboard.tags.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "8px 0" }}>
          {dashboard.tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: "#f0f0f0",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                color: "#666",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div style={{ fontSize: "12px", color: "#999", marginTop: "12px" }}>
        <div>Created: {formatDate(dashboard.createdAt)}</div>
        <div>Updated: {formatDate(dashboard.updatedAt)}</div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
        {onEdit && (
          <button
            type="button"
            onClick={handleEditClick}
            aria-label="Edit dashboard"
            style={{
              padding: "6px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: "white",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            aria-label="Delete dashboard"
            style={{
              padding: "6px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: "white",
              cursor: "pointer",
              fontSize: "14px",
              color: "#d32f2f",
            }}
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}
