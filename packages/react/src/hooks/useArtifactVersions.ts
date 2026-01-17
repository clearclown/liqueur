/**
 * useArtifactVersions Hook
 * Artifactバージョン管理Hook
 */

import { useState, useCallback, useEffect } from "react";
import type { ArtifactVersion, CreateVersionInput, VersionDiff } from "@liqueur/artifact-store";

export interface UseArtifactVersionsOptions {
  /** Artifact ID */
  artifactId: string;
  /** API base URL (デフォルト: /api/liquid/artifacts) */
  apiBaseUrl?: string;
  /** 自動ロード (デフォルト: true) */
  autoLoad?: boolean;
}

export interface UseArtifactVersionsReturn {
  /** バージョン一覧 */
  versions: ArtifactVersion[];
  /** ローディング中 */
  isLoading: boolean;
  /** エラー */
  error: string | null;
  /** バージョン一覧を再取得 */
  refresh: () => Promise<void>;
  /** 新しいバージョンを作成 */
  createVersion: (input: CreateVersionInput) => Promise<ArtifactVersion | null>;
  /** バージョンを削除 */
  deleteVersion: (version: number) => Promise<void>;
  /** バージョンを復元 */
  restoreVersion: (version: number) => Promise<void>;
  /** 差分を取得 */
  getDiff: (fromVersion: number, toVersion: number) => Promise<VersionDiff | null>;
}

/**
 * useArtifactVersions - Artifactバージョン管理Hook
 */
export function useArtifactVersions(
  options: UseArtifactVersionsOptions
): UseArtifactVersionsReturn {
  const { artifactId, apiBaseUrl = "/api/liquid/artifacts", autoLoad = true } = options;

  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/${artifactId}/versions`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to fetch versions");
      }

      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch versions";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [artifactId, apiBaseUrl]);

  const createVersion = useCallback(
    async (input: CreateVersionInput): Promise<ArtifactVersion | null> => {
      setError(null);

      try {
        const response = await fetch(`${apiBaseUrl}/${artifactId}/versions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || "Failed to create version");
        }

        const data = await response.json();
        const newVersion = data.version;

        // Update local state
        setVersions((prev) => [newVersion, ...prev]);

        return newVersion;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create version";
        setError(message);
        return null;
      }
    },
    [artifactId, apiBaseUrl]
  );

  const deleteVersion = useCallback(
    async (version: number): Promise<void> => {
      setError(null);

      try {
        const response = await fetch(`${apiBaseUrl}/${artifactId}/versions/${version}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || "Failed to delete version");
        }

        // Update local state
        setVersions((prev) => prev.filter((v) => v.version !== version));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete version";
        setError(message);
        throw err;
      }
    },
    [artifactId, apiBaseUrl]
  );

  const restoreVersion = useCallback(
    async (version: number): Promise<void> => {
      setError(null);

      try {
        const response = await fetch(`${apiBaseUrl}/${artifactId}/restore`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ version }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || "Failed to restore version");
        }

        // Refresh versions after restore
        await refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to restore version";
        setError(message);
        throw err;
      }
    },
    [artifactId, apiBaseUrl, refresh]
  );

  const getDiff = useCallback(
    async (fromVersion: number, toVersion: number): Promise<VersionDiff | null> => {
      setError(null);

      try {
        const response = await fetch(
          `${apiBaseUrl}/${artifactId}/diff?from=${fromVersion}&to=${toVersion}`
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || "Failed to get diff");
        }

        const data = await response.json();
        return data.diff;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get diff";
        setError(message);
        return null;
      }
    },
    [artifactId, apiBaseUrl]
  );

  // Auto-load versions on mount
  useEffect(() => {
    if (autoLoad && artifactId) {
      refresh();
    }
  }, [autoLoad, artifactId, refresh]);

  return {
    versions,
    isLoading,
    error,
    refresh,
    createVersion,
    deleteVersion,
    restoreVersion,
    getDiff,
  };
}
