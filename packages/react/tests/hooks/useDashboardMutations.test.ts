import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDashboardMutations } from "../../src/hooks/useDashboardMutations";
import type { CreateDashboardInput, UpdateDashboardInput } from "../../src/types";

// Mock fetch
global.fetch = vi.fn();

describe("useDashboardMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDashboard", () => {
    it("should create a dashboard", async () => {
      const mockDashboard = {
        id: "new-id",
        userId: "user1",
        title: "New Dashboard",
        description: "Test Description",
        schema: { version: "1.0", layout: { type: "grid", columns: 12 }, components: [] },
        version: 1,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        tags: [],
        visibility: "private" as const,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboard,
      });

      const input: CreateDashboardInput = {
        title: "New Dashboard",
        description: "Test Description",
        schema: { version: "1.0", layout: { type: "grid", columns: 12 }, components: [] },
      };

      const { result } = renderHook(() => useDashboardMutations());

      expect(result.current.isCreating).toBe(false);

      let createdDashboard;
      await act(async () => {
        createdDashboard = await result.current.createDashboard(input);
      });

      expect(createdDashboard).toEqual(mockDashboard);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/liquid/artifacts",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
      );
    });

    it("should handle creation error", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const input: CreateDashboardInput = {
        title: "New Dashboard",
        schema: { version: "1.0", layout: { type: "grid", columns: 12 }, components: [] },
      };

      const { result } = renderHook(() => useDashboardMutations());

      await expect(act(async () => {
        await result.current.createDashboard(input);
      })).rejects.toThrow("Network error");
    });
  });

  describe("updateDashboard", () => {
    it("should update a dashboard", async () => {
      const mockDashboard = {
        id: "existing-id",
        userId: "user1",
        title: "Updated Dashboard",
        description: "Updated Description",
        schema: { version: "1.0", layout: { type: "grid", columns: 12 }, components: [] },
        version: 2,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        tags: [],
        visibility: "private" as const,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboard,
      });

      const input: UpdateDashboardInput = {
        title: "Updated Dashboard",
        description: "Updated Description",
      };

      const { result } = renderHook(() => useDashboardMutations());

      expect(result.current.isUpdating).toBe(false);

      let updatedDashboard;
      await act(async () => {
        updatedDashboard = await result.current.updateDashboard("existing-id", input);
      });

      expect(updatedDashboard).toEqual(mockDashboard);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/liquid/artifacts/existing-id",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
      );
    });

    it("should handle update error", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Not found"));

      const input: UpdateDashboardInput = { title: "Updated" };

      const { result } = renderHook(() => useDashboardMutations());

      await expect(act(async () => {
        await result.current.updateDashboard("non-existent", input);
      })).rejects.toThrow("Not found");
    });
  });

  describe("deleteDashboard", () => {
    it("should delete a dashboard", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useDashboardMutations());

      expect(result.current.isDeleting).toBe(false);

      await act(async () => {
        await result.current.deleteDashboard("dashboard-to-delete");
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/liquid/artifacts/dashboard-to-delete",
        expect.objectContaining({
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("should handle deletion error", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Delete failed"));

      const { result } = renderHook(() => useDashboardMutations());

      await expect(act(async () => {
        await result.current.deleteDashboard("id");
      })).rejects.toThrow("Delete failed");
    });
  });

  describe("loading states", () => {
    it("should manage isCreating state", async () => {
      const mockDashboard = {
        id: "new-id",
        userId: "user1",
        title: "New",
        schema: { version: "1.0", layout: { type: "grid", columns: 12 }, components: [] },
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        visibility: "private" as const,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboard,
      });

      const { result } = renderHook(() => useDashboardMutations());

      expect(result.current.isCreating).toBe(false);

      await act(async () => {
        await result.current.createDashboard({
          title: "New",
          schema: { version: "1.0", layout: { type: "grid", columns: 12 }, components: [] },
        });
      });

      // Should finish loading
      expect(result.current.isCreating).toBe(false);
    });
  });

  it("should handle non-ok response", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
    });

    const { result } = renderHook(() => useDashboardMutations());

    await expect(act(async () => {
      await result.current.createDashboard({
        title: "Test",
        schema: { version: "1.0", layout: { type: "grid", columns: 12 }, components: [] },
      });
    })).rejects.toThrow("Failed to create dashboard");
  });
});
