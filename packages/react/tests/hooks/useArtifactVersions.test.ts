/**
 * useArtifactVersions Hook Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useArtifactVersions } from "../../src/hooks/useArtifactVersions";
import type { ArtifactVersion, VersionDiff } from "@liqueur/artifact-store";
import type { LiquidViewSchema } from "@liqueur/protocol";

const mockSchema: LiquidViewSchema = {
  version: "1.0",
  layout: { type: "grid", columns: 2, gap: 16 },
  components: [],
  data_sources: {},
};

const mockVersions: ArtifactVersion[] = [
  {
    version: 1,
    schema: mockSchema,
    message: "Initial version",
    createdAt: new Date("2024-01-01"),
    authorId: "user1",
  },
  {
    version: 2,
    schema: { ...mockSchema, layout: { type: "stack", direction: "vertical", gap: 8 } },
    message: "Changed to stack layout",
    createdAt: new Date("2024-01-02"),
    authorId: "user1",
  },
];

const mockDiff: VersionDiff = {
  fromVersion: 1,
  toVersion: 2,
  changes: [
    {
      type: "modify",
      path: "layout.type",
      oldValue: "grid",
      newValue: "stack",
      description: "Changed layout.type from grid to stack",
    },
  ],
};

describe("useArtifactVersions", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      expect(result.current.versions).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should fetch versions on mount", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ versions: mockVersions }),
      });

      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.versions).toEqual(mockVersions);
      expect(global.fetch).toHaveBeenCalledWith("/api/liquid/artifacts/test-id/versions");
    });

    it("should handle fetch error", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toBe("Network error");
      expect(result.current.versions).toEqual([]);
    });

    it("should handle non-ok response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: "Not found" } }),
      });

      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Not found");
      expect(result.current.versions).toEqual([]);
    });

    it("should not fetch if autoLoad is false", () => {
      renderHook(() =>
        useArtifactVersions({
          artifactId: "test-id",
          apiBaseUrl: "/api/liquid/artifacts",
          autoLoad: false,
        })
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    it("should refetch versions", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ versions: mockVersions }),
      });

      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (global.fetch as any).mockClear();
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ versions: [...mockVersions, { version: 3 } as any] }),
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.current.versions).toHaveLength(3);
    });
  });

  describe("createVersion", () => {
    it("should create a new version", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ versions: mockVersions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            version: {
              version: 3,
              schema: mockSchema,
              message: "New version",
              createdAt: new Date(),
              authorId: "user1",
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            versions: [...mockVersions, { version: 3 } as any],
          }),
        });

      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createVersion({ schema: mockSchema, message: "New version" });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/liquid/artifacts/test-id/versions",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schema: mockSchema, message: "New version" }),
        })
      );

      // Should refresh after creation
      await waitFor(() => {
        expect(result.current.versions).toHaveLength(3);
      });
    });

    it("should handle create error", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ versions: mockVersions }),
        })
        .mockRejectedValueOnce(new Error("Create failed"));

      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let version: ArtifactVersion | null = null;
      await act(async () => {
        version = await result.current.createVersion({ schema: mockSchema });
      });

      expect(version).toBeNull();
      expect(result.current.error).toBe("Create failed");
    });

    it("should handle create non-ok response", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ versions: mockVersions }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: "Invalid schema" } }),
        });

      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let version: ArtifactVersion | null = null;
      await act(async () => {
        version = await result.current.createVersion({ schema: mockSchema });
      });

      expect(version).toBeNull();
      expect(result.current.error).toBe("Invalid schema");
    });
  });

  describe("deleteVersion", () => {
    it("should delete a version", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ versions: mockVersions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ versions: [mockVersions[1]] }),
        });

      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteVersion(1);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/liquid/artifacts/test-id/versions/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );

      // Should refresh after deletion
      await waitFor(() => {
        expect(result.current.versions).toHaveLength(1);
      });
    });

    it("should handle delete error", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ versions: mockVersions }),
        })
        .mockRejectedValueOnce(new Error("Delete failed"));

      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.deleteVersion(1);
        } catch (e) {
          // Expected to fail
        }
      });

      expect(result.current.error).toBe("Delete failed");
    });
  });

  describe("restoreVersion", () => {
    it("should restore to a specific version", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ versions: mockVersions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ artifact: { schema: mockVersions[0].schema } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ versions: mockVersions }),
        });

      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.restoreVersion(1);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/liquid/artifacts/test-id/restore",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: 1 }),
        })
      );

      // Should refresh after restoration
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("should handle restore error", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ versions: mockVersions }),
        })
        .mockRejectedValueOnce(new Error("Restore failed"));

      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.restoreVersion(1);
        } catch (e) {
          // Expected to fail
        }
      });

      expect(result.current.error).toBe("Restore failed");
    });
  });

  describe("getDiff", () => {
    it("should fetch diff between versions", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ versions: mockVersions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ diff: mockDiff }),
        });

      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let diff: VersionDiff | null = null;
      await act(async () => {
        diff = await result.current.getDiff(1, 2);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/liquid/artifacts/test-id/diff?from=1&to=2"
      );
      expect(diff).toEqual(mockDiff);
    });

    it("should handle getDiff error", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ versions: mockVersions }),
        })
        .mockRejectedValueOnce(new Error("Diff failed"));

      const { result } = renderHook(() =>
        useArtifactVersions({ artifactId: "test-id", apiBaseUrl: "/api/liquid/artifacts" })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let diff: VersionDiff | null = null;
      await act(async () => {
        diff = await result.current.getDiff(1, 2);
      });

      expect(diff).toBeNull();
      expect(result.current.error).toBe("Diff failed");
    });
  });
});
