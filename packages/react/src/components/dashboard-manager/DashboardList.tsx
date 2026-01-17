import React from "react";
import type { Dashboard } from "../../types";
import { DashboardCard } from "./DashboardCard";

/**
 * DashboardList props
 * ダッシュボード一覧プロパティ
 */
export interface DashboardListProps {
  /** List of dashboards to display */
  dashboards: Dashboard[];

  /** Loading state */
  isLoading?: boolean;

  /** Error message */
  error?: Error | null;

  /** Called when a dashboard is selected */
  onSelect?: (dashboard: Dashboard) => void;

  /** Called when favorite button is clicked */
  onFavoriteToggle?: (id: string) => void;

  /** Called when edit button is clicked */
  onEdit?: (dashboard: Dashboard) => void;

  /** Called when delete button is clicked */
  onDelete?: (id: string) => void;

  /** Custom card renderer */
  renderCard?: (dashboard: Dashboard) => React.ReactNode;

  /** Additional class name */
  className?: string;
}

/**
 * DashboardList component
 * ダッシュボード一覧コンポーネント
 *
 * Displays a grid of dashboard cards with loading and error states.
 * グリッドレイアウトでダッシュボードカードを表示（ローディング・エラー状態対応）
 *
 * @example
 * ```tsx
 * <DashboardList
 *   dashboards={dashboards}
 *   isLoading={isLoading}
 *   error={error}
 *   onSelect={(d) => console.log("Selected:", d.id)}
 *   onFavoriteToggle={(id) => console.log("Toggle favorite:", id)}
 *   onEdit={(d) => console.log("Edit:", d.id)}
 *   onDelete={(id) => console.log("Delete:", id)}
 * />
 * ```
 */
export function DashboardList({
  dashboards,
  isLoading = false,
  error = null,
  onSelect,
  onFavoriteToggle,
  onEdit,
  onDelete,
  renderCard,
  className = "",
}: DashboardListProps): JSX.Element {
  // Loading state
  if (isLoading) {
    return (
      <div className={`dashboard-list ${className}`} role="status" aria-live="polite">
        <p>Loading dashboards...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`dashboard-list ${className}`} role="alert">
        <p style={{ color: "#d32f2f" }}>Error: {error.message}</p>
      </div>
    );
  }

  // Empty state
  if (dashboards.length === 0) {
    return (
      <div className={`dashboard-list ${className}`}>
        <p style={{ color: "#666", textAlign: "center", padding: "32px" }}>
          No dashboards found. Create your first dashboard to get started!
        </p>
      </div>
    );
  }

  // Dashboard grid
  return (
    <div
      className={`dashboard-list ${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "16px",
        padding: "16px 0",
      }}
    >
      {dashboards.map((dashboard) => {
        if (renderCard) {
          return <div key={dashboard.id}>{renderCard(dashboard)}</div>;
        }

        return (
          <DashboardCard
            key={dashboard.id}
            dashboard={dashboard}
            onSelect={onSelect}
            onFavoriteToggle={onFavoriteToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}
