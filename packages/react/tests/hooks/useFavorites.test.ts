import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFavorites } from "../../src/hooks/useFavorites";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useFavorites", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("should initialize with empty favorites", () => {
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites.size).toBe(0);
    expect(result.current.isFavorite("any-id")).toBe(false);
  });

  it("should load favorites from localStorage", () => {
    localStorageMock.setItem(
      "liqueur:favorites",
      JSON.stringify(["dashboard-1", "dashboard-2"])
    );

    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites.size).toBe(2);
    expect(result.current.isFavorite("dashboard-1")).toBe(true);
    expect(result.current.isFavorite("dashboard-2")).toBe(true);
    expect(result.current.isFavorite("dashboard-3")).toBe(false);
  });

  it("should add a favorite", () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite("dashboard-1");
    });

    expect(result.current.favorites.size).toBe(1);
    expect(result.current.isFavorite("dashboard-1")).toBe(true);

    // Check localStorage
    const stored = JSON.parse(localStorageMock.getItem("liqueur:favorites") || "[]");
    expect(stored).toContain("dashboard-1");
  });

  it("should remove a favorite", () => {
    localStorageMock.setItem(
      "liqueur:favorites",
      JSON.stringify(["dashboard-1", "dashboard-2"])
    );

    const { result } = renderHook(() => useFavorites());

    expect(result.current.isFavorite("dashboard-1")).toBe(true);

    act(() => {
      result.current.toggleFavorite("dashboard-1");
    });

    expect(result.current.isFavorite("dashboard-1")).toBe(false);
    expect(result.current.favorites.size).toBe(1);

    // Check localStorage
    const stored = JSON.parse(localStorageMock.getItem("liqueur:favorites") || "[]");
    expect(stored).not.toContain("dashboard-1");
    expect(stored).toContain("dashboard-2");
  });

  it("should toggle multiple favorites", () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite("dashboard-1");
      result.current.toggleFavorite("dashboard-2");
      result.current.toggleFavorite("dashboard-3");
    });

    expect(result.current.favorites.size).toBe(3);

    act(() => {
      result.current.toggleFavorite("dashboard-2");
    });

    expect(result.current.favorites.size).toBe(2);
    expect(result.current.isFavorite("dashboard-1")).toBe(true);
    expect(result.current.isFavorite("dashboard-2")).toBe(false);
    expect(result.current.isFavorite("dashboard-3")).toBe(true);
  });

  it("should handle invalid localStorage data gracefully", () => {
    localStorageMock.setItem("liqueur:favorites", "invalid-json");

    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites.size).toBe(0);
  });

  it("should use custom storage key", () => {
    const { result } = renderHook(() => useFavorites({ storageKey: "custom:key" }));

    act(() => {
      result.current.toggleFavorite("dashboard-1");
    });

    expect(localStorageMock.getItem("custom:key")).toBeTruthy();
    expect(localStorageMock.getItem("liqueur:favorites")).toBeNull();
  });

  it("should call onChange callback", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useFavorites({ onChange }));

    // Clear initial calls
    onChange.mockClear();

    act(() => {
      result.current.toggleFavorite("dashboard-1");
    });

    expect(onChange).toHaveBeenCalledWith(expect.any(Set));
    expect(onChange).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.toggleFavorite("dashboard-1");
    });

    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
