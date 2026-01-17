import { useState, useCallback } from "react";
import type { Dashboard, CreateDashboardInput, UpdateDashboardInput } from "../types";

/**
 * useDashboardMutations return type
 * ダッシュボード変更操作戻り値型
 */
export interface UseDashboardMutationsReturn {
  /** ダッシュボード作成関数 */
  createDashboard: (data: CreateDashboardInput) => Promise<Dashboard>;

  /** ダッシュボード更新関数 */
  updateDashboard: (id: string, data: UpdateDashboardInput) => Promise<Dashboard>;

  /** ダッシュボード削除関数 */
  deleteDashboard: (id: string) => Promise<void>;

  /** 作成中フラグ */
  isCreating: boolean;

  /** 更新中フラグ */
  isUpdating: boolean;

  /** 削除中フラグ */
  isDeleting: boolean;
}

/**
 * useDashboardMutations options
 * ダッシュボード変更操作オプション
 */
export interface UseDashboardMutationsOptions {
  /** API base URL (default: /api/liquid/artifacts) */
  apiBaseUrl?: string;

  /** Callback after successful creation */
  onCreateSuccess?: (dashboard: Dashboard) => void;

  /** Callback after successful update */
  onUpdateSuccess?: (dashboard: Dashboard) => void;

  /** Callback after successful deletion */
  onDeleteSuccess?: (id: string) => void;

  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Create a dashboard via API
 * APIでダッシュボードを作成
 */
async function createDashboardAPI(
  input: CreateDashboardInput,
  baseUrl: string
): Promise<Dashboard> {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to create dashboard: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as Dashboard;
}

/**
 * Update a dashboard via API
 * APIでダッシュボードを更新
 */
async function updateDashboardAPI(
  id: string,
  input: UpdateDashboardInput,
  baseUrl: string
): Promise<Dashboard> {
  const response = await fetch(`${baseUrl}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to update dashboard: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as Dashboard;
}

/**
 * Delete a dashboard via API
 * APIでダッシュボードを削除
 */
async function deleteDashboardAPI(id: string, baseUrl: string): Promise<void> {
  const response = await fetch(`${baseUrl}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete dashboard: ${response.status} ${response.statusText}`);
  }
}

/**
 * useDashboardMutations hook
 * ダッシュボードCRUD操作を提供するカスタムフック
 *
 * @param options - オプション
 * @returns CRUD操作関数と状態
 *
 * @example
 * ```tsx
 * const { createDashboard, updateDashboard, deleteDashboard, isCreating } =
 *   useDashboardMutations({
 *     onCreateSuccess: (dashboard) => console.log("Created:", dashboard.id),
 *     onError: (error) => console.error(error),
 *   });
 *
 * // Create
 * await createDashboard({
 *   title: "New Dashboard",
 *   schema: { ... },
 * });
 *
 * // Update
 * await updateDashboard("dashboard-id", {
 *   title: "Updated Title",
 * });
 *
 * // Delete
 * await deleteDashboard("dashboard-id");
 * ```
 */
export function useDashboardMutations(
  options: UseDashboardMutationsOptions = {}
): UseDashboardMutationsReturn {
  const { apiBaseUrl = "/api/liquid/artifacts", onCreateSuccess, onUpdateSuccess, onDeleteSuccess, onError } = options;

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createDashboard = useCallback(
    async (data: CreateDashboardInput): Promise<Dashboard> => {
      setIsCreating(true);
      try {
        const dashboard = await createDashboardAPI(data, apiBaseUrl);
        onCreateSuccess?.(dashboard);
        return dashboard;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        onError?.(err);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [apiBaseUrl, onCreateSuccess, onError]
  );

  const updateDashboard = useCallback(
    async (id: string, data: UpdateDashboardInput): Promise<Dashboard> => {
      setIsUpdating(true);
      try {
        const dashboard = await updateDashboardAPI(id, data, apiBaseUrl);
        onUpdateSuccess?.(dashboard);
        return dashboard;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        onError?.(err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [apiBaseUrl, onUpdateSuccess, onError]
  );

  const deleteDashboard = useCallback(
    async (id: string): Promise<void> => {
      setIsDeleting(true);
      try {
        await deleteDashboardAPI(id, apiBaseUrl);
        onDeleteSuccess?.(id);
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        onError?.(err);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [apiBaseUrl, onDeleteSuccess, onError]
  );

  return {
    createDashboard,
    updateDashboard,
    deleteDashboard,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
