import { useState, useEffect, useCallback } from "react";
import type { Dashboard } from "../types";

/**
 * useDashboards options
 * ダッシュボード一覧取得オプション
 */
export interface UseDashboardsOptions {
  /** 検索クエリ（タイトル・説明での部分一致） */
  search?: string;

  /** ソートフィールド */
  sort?: "name" | "created" | "updated";

  /** ソート順序 */
  order?: "asc" | "desc";

  /** お気に入りのみ表示 */
  favorites?: boolean;

  /** ページネーション: オフセット */
  offset?: number;

  /** ページネーション: 件数 */
  limit?: number;

  /** API base URL (default: /api/liquid/artifacts) */
  apiBaseUrl?: string;
}

/**
 * useDashboards return type
 * ダッシュボード一覧取得戻り値型
 */
export interface UseDashboardsReturn {
  /** ダッシュボード一覧 */
  dashboards: Dashboard[];

  /** ローディング中フラグ */
  isLoading: boolean;

  /** エラー */
  error: Error | null;

  /** 再取得関数 */
  refresh: () => Promise<void>;

  /** 総件数 */
  total: number;
}

/**
 * Build query string from options
 * オプションからクエリ文字列を構築
 */
function buildQueryString(options: UseDashboardsOptions): string {
  const params = new URLSearchParams();

  if (options.search) {
    params.append("search", options.search);
  }

  if (options.sort) {
    // Map 'name' to 'title' for API compatibility
    const sortField = options.sort === "name" ? "title" : options.sort === "created" ? "createdAt" : "updatedAt";
    params.append("sortBy", sortField);
  }

  if (options.order) {
    params.append("sortOrder", options.order);
  }

  if (options.favorites !== undefined) {
    params.append("favorites", String(options.favorites));
  }

  if (options.offset !== undefined) {
    params.append("offset", String(options.offset));
  }

  if (options.limit !== undefined) {
    params.append("limit", String(options.limit));
  }

  return params.toString();
}

/**
 * Fetch dashboards from API
 * APIからダッシュボードを取得
 */
async function fetchDashboards(options: UseDashboardsOptions): Promise<{ dashboards: Dashboard[]; total: number }> {
  const baseUrl = options.apiBaseUrl || "/api/liquid/artifacts";
  const queryString = buildQueryString(options);
  const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboards: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { artifacts?: Dashboard[]; total?: number };

  return {
    dashboards: data.artifacts || [],
    total: data.total || 0,
  };
}

/**
 * useDashboards hook
 * ダッシュボード一覧を取得するカスタムフック
 *
 * @param options - ダッシュボード一覧取得オプション
 * @returns ダッシュボード一覧と状態
 *
 * @example
 * ```tsx
 * const { dashboards, isLoading, error, refresh } = useDashboards({
 *   search: "expense",
 *   sort: "created",
 *   order: "desc",
 * });
 * ```
 */
export function useDashboards(options: UseDashboardsOptions = {}): UseDashboardsReturn {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const loadDashboards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchDashboards(options);
      setDashboards(result.dashboards);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setDashboards([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    options.search,
    options.sort,
    options.order,
    options.favorites,
    options.offset,
    options.limit,
    options.apiBaseUrl,
  ]);

  useEffect(() => {
    loadDashboards();
  }, [loadDashboards]);

  const refresh = useCallback(async () => {
    await loadDashboards();
  }, [loadDashboards]);

  return {
    dashboards,
    isLoading,
    error,
    refresh,
    total,
  };
}
