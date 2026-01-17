import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDashboards } from "../../src/hooks/useDashboards";

// Mock fetch
global.fetch = vi.fn();

describe("useDashboards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch dashboards on mount", async () => {
    const mockDashboards = [
      {
        id: "1",
        userId: "user1",
        title: "Test Dashboard",
        description: "Test Description",
        schema: { version: "1.0", layout: { type: "grid", columns: 12 }, components: [] },
        version: 1,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        tags: [],
        visibility: "private" as const,
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ artifacts: mockDashboards, total: 1, offset: 0, limit: 10 }),
    });

    const { result } = renderHook(() => useDashboards());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.dashboards).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dashboards).toHaveLength(1);
    expect(result.current.dashboards[0].title).toBe("Test Dashboard");
    expect(result.current.error).toBeNull();
  });

  it("should handle search query", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ artifacts: [], total: 0, offset: 0, limit: 10 }),
    });

    const { result } = renderHook(() => useDashboards({ search: "test query" }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callArgs = (global.fetch as any).mock.calls[0];
    expect(callArgs[0]).toContain("search=");
    expect(callArgs[0]).toContain("test");
    expect(callArgs[0]).toContain("query");
  });

  it("should handle sort and order options", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ artifacts: [], total: 0, offset: 0, limit: 10 }),
    });

    const { result } = renderHook(() =>
      useDashboards({ sort: "name", order: "asc" })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callArgs = (global.fetch as any).mock.calls[0];
    // 'name' is mapped to 'title' in the API
    expect(callArgs[0]).toContain("sortBy=title");
    expect(callArgs[0]).toContain("sortOrder=asc");
  });

  it("should handle favorites filter", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ artifacts: [], total: 0, offset: 0, limit: 10 }),
    });

    const { result } = renderHook(() => useDashboards({ favorites: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("favorites=true"),
      expect.any(Object)
    );
  });

  it("should handle fetch error", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useDashboards());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe("Network error");
    expect(result.current.dashboards).toEqual([]);
  });

  it("should refresh dashboards when refresh is called", async () => {
    const mockDashboards = [
      {
        id: "1",
        userId: "user1",
        title: "Dashboard 1",
        schema: { version: "1.0", layout: { type: "grid", columns: 12 }, components: [] },
        version: 1,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        tags: [],
        visibility: "private" as const,
      },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ artifacts: mockDashboards, total: 1, offset: 0, limit: 10 }),
    });

    const { result } = renderHook(() => useDashboards());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Call refresh
    await result.current.refresh();

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("should handle non-ok response", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const { result } = renderHook(() => useDashboards());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.dashboards).toEqual([]);
  });

  it("should update when options change", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ artifacts: [], total: 0, offset: 0, limit: 10 }),
    });

    const { result, rerender } = renderHook(
      ({ search }: { search?: string }) => useDashboards({ search }),
      { initialProps: { search: "initial" } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("search=initial"),
      expect.any(Object)
    );

    // Change search
    rerender({ search: "updated" });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("search=updated"),
        expect.any(Object)
      );
    });
  });
});
