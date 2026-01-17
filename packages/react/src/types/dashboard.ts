import type { Artifact, CreateArtifactInput, UpdateArtifactInput } from "@liqueur/artifact-store";

/**
 * Dashboard - Extended Artifact with favorite support
 * ダッシュボード（お気に入り機能付きArtifact）
 */
export interface Dashboard extends Artifact {
  /** お気に入りフラグ（クライアント側で管理） */
  favorite?: boolean;
}

/**
 * Dashboard creation input
 * ダッシュボード作成入力
 */
export type CreateDashboardInput = CreateArtifactInput;

/**
 * Dashboard update input
 * ダッシュボード更新入力
 */
export type UpdateDashboardInput = UpdateArtifactInput;

/**
 * Dashboard list query options
 * ダッシュボード一覧クエリオプション
 */
export interface DashboardListQuery {
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
}

/**
 * Sort configuration for dashboards
 * ダッシュボードソート設定
 */
export interface DashboardSort {
  field: "name" | "created" | "updated";
  direction: "asc" | "desc";
}
