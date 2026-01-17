import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useConversation } from "../../src/hooks/useConversation";
import type { DatabaseMetadata } from "@liqueur/ai-provider";

// Mock fetch
global.fetch = vi.fn();

const mockMetadata: DatabaseMetadata = {
  tables: [
    {
      name: "expenses",
      columns: [
        { name: "id", type: "integer", nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: "amount", type: "decimal", nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
  ],
};

describe("useConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty conversation", () => {
    const { result } = renderHook(() => useConversation({ metadata: mockMetadata }));

    expect(result.current.messages).toEqual([]);
    expect(result.current.currentArtifact).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should send initial message and generate schema", async () => {
    const mockSchema = {
      version: "1.0",
      layout: { type: "grid", columns: 12 },
      components: [],
      data_sources: {},
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        schema: mockSchema,
        artifactId: "art-123",
      }),
    });

    const { result } = renderHook(() => useConversation({ metadata: mockMetadata }));

    await act(async () => {
      await result.current.sendMessage("Create a bar chart");
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    // User message
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[0].content).toBe("Create a bar chart");

    // AI message
    expect(result.current.messages[1].role).toBe("assistant");
    expect(result.current.messages[1].schema).toEqual(mockSchema);
    expect(result.current.messages[1].artifactId).toBe("art-123");
  });

  it("should send follow-up message", async () => {
    const initialSchema = {
      version: "1.0",
      layout: { type: "grid", columns: 12 },
      components: [{ type: "chart" as const, variant: "bar" as const }],
      data_sources: {},
    };

    const updatedSchema = {
      version: "1.0",
      layout: { type: "grid", columns: 12 },
      components: [{ type: "chart" as const, variant: "pie" as const }],
      data_sources: {},
    };

    // First message
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        schema: initialSchema,
        artifactId: "art-123",
      }),
    });

    const { result } = renderHook(() => useConversation({ metadata: mockMetadata }));

    await act(async () => {
      await result.current.sendMessage("Create a bar chart");
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    // Follow-up message
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        schema: updatedSchema,
        artifactId: "art-123",
      }),
    });

    await act(async () => {
      await result.current.sendMessage("Change to pie chart");
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(4);
    });

    // Verify follow-up API was called
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/liquid/follow-up",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("should handle API error", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useConversation({ metadata: mockMetadata }));

    await act(async () => {
      await result.current.sendMessage("Create a chart");
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
    });

    // Should have error message
    const lastMessage = result.current.messages[result.current.messages.length - 1];
    expect(lastMessage.status).toBe("error");
  });

  it("should clear conversation", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        schema: { version: "1.0", layout: { type: "grid", columns: 12 }, components: [], data_sources: {} },
        artifactId: "art-123",
      }),
    });

    const { result } = renderHook(() => useConversation({ metadata: mockMetadata }));

    await act(async () => {
      await result.current.sendMessage("Test message");
    });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should set loading state during send", async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as any).mockReturnValueOnce(promise);

    const { result } = renderHook(() => useConversation({ metadata: mockMetadata }));

    act(() => {
      result.current.sendMessage("Test");
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise({
        ok: true,
        json: async () => ({
          schema: { version: "1.0", layout: { type: "grid", columns: 12 }, components: [], data_sources: {} },
        }),
      });
      await promise;
    });

    // Should no longer be loading
    expect(result.current.isLoading).toBe(false);
  });

  it("should not send empty message", async () => {
    const { result } = renderHook(() => useConversation({ metadata: mockMetadata }));

    await act(async () => {
      await result.current.sendMessage("   ");
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  it("should trim message before sending", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        schema: { version: "1.0", layout: { type: "grid", columns: 12 }, components: [], data_sources: {} },
      }),
    });

    const { result } = renderHook(() => useConversation({ metadata: mockMetadata }));

    await act(async () => {
      await result.current.sendMessage("  Test message  ");
    });

    await waitFor(() => {
      expect(result.current.messages[0].content).toBe("Test message");
    });
  });

  it("should return current artifact", async () => {
    const mockSchema = {
      version: "1.0",
      layout: { type: "grid", columns: 12 },
      components: [],
      data_sources: {},
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        schema: mockSchema,
      }),
    });

    const { result } = renderHook(() => useConversation({ metadata: mockMetadata }));

    await act(async () => {
      await result.current.sendMessage("Create chart");
    });

    await waitFor(() => {
      expect(result.current.currentArtifact).toEqual(mockSchema);
    });
  });
});
