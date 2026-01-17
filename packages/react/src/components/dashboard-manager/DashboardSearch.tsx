import React, { useState, useEffect } from "react";

/**
 * DashboardSearch props
 * ダッシュボード検索プロパティ
 */
export interface DashboardSearchProps {
  /** Called when search query changes (debounced) */
  onSearch: (query: string) => void;

  /** Called when sort field changes */
  onSortChange: (sort: "name" | "created" | "updated") => void;

  /** Called when sort order changes */
  onOrderChange: (order: "asc" | "desc") => void;

  /** Called when favorites filter is toggled */
  onFavoritesToggle: (enabled: boolean) => void;

  /** Initial search query */
  initialSearch?: string;

  /** Initial sort field */
  initialSort?: "name" | "created" | "updated";

  /** Initial sort order */
  initialOrder?: "asc" | "desc";

  /** Initial favorites filter */
  initialFavorites?: boolean;

  /** Debounce delay in milliseconds */
  debounceMs?: number;

  /** Additional class name */
  className?: string;
}

/**
 * DashboardSearch component
 * ダッシュボード検索コンポーネント
 *
 * Provides search, sort, and filter controls for dashboards.
 * ダッシュボードの検索・ソート・フィルタコントロール
 *
 * @example
 * ```tsx
 * <DashboardSearch
 *   onSearch={(query) => console.log("Search:", query)}
 *   onSortChange={(sort) => console.log("Sort by:", sort)}
 *   onOrderChange={(order) => console.log("Order:", order)}
 *   onFavoritesToggle={(enabled) => console.log("Favorites:", enabled)}
 * />
 * ```
 */
export function DashboardSearch({
  onSearch,
  onSortChange,
  onOrderChange,
  onFavoritesToggle,
  initialSearch = "",
  initialSort = "created",
  initialOrder = "desc",
  initialFavorites = false,
  debounceMs = 300,
  className = "",
}: DashboardSearchProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);
  const [order, setOrder] = useState(initialOrder);
  const [favorites, setFavorites] = useState(initialFavorites);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [searchQuery, onSearch, debounceMs]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = (e.target as HTMLSelectElement).value as "name" | "created" | "updated";
    setSort(newSort);
    onSortChange(newSort);
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOrder = (e.target as HTMLSelectElement).value as "asc" | "desc";
    setOrder(newOrder);
    onOrderChange(newOrder);
  };

  const handleFavoritesToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = (e.target as HTMLInputElement).checked;
    setFavorites(enabled);
    onFavoritesToggle(enabled);
  };

  return (
    <div
      className={`dashboard-search ${className}`}
      style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        alignItems: "center",
        padding: "16px",
        background: "#f5f5f5",
        borderRadius: "8px",
        marginBottom: "16px",
      }}
    >
      {/* Search input */}
      <div style={{ flex: "1 1 300px" }}>
        <label htmlFor="dashboard-search" style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
          Search
        </label>
        <input
          id="dashboard-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
          placeholder="Search by title or description..."
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />
      </div>

      {/* Sort field */}
      <div style={{ flex: "0 1 150px" }}>
        <label htmlFor="dashboard-sort" style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
          Sort by
        </label>
        <select
          id="dashboard-sort"
          value={sort}
          onChange={handleSortChange}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          <option value="name">Name</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
        </select>
      </div>

      {/* Sort order */}
      <div style={{ flex: "0 1 120px" }}>
        <label htmlFor="dashboard-order" style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
          Order
        </label>
        <select
          id="dashboard-order"
          value={order}
          onChange={handleOrderChange}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {/* Favorites filter */}
      <div style={{ flex: "0 1 auto", display: "flex", alignItems: "center", paddingTop: "20px" }}>
        <label htmlFor="dashboard-favorites" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input
            id="dashboard-favorites"
            type="checkbox"
            checked={favorites}
            onChange={handleFavoritesToggle}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          <span style={{ fontSize: "14px" }}>Favorites only</span>
        </label>
      </div>
    </div>
  );
}
