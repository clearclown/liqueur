import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MessageItem } from "../../../src/components/chat/MessageItem";
import type { Message } from "../../../src/types/chat";

describe("MessageItem", () => {
  const mockUserMessage: Message = {
    id: "msg-1",
    role: "user",
    content: "Test user message",
    timestamp: new Date("2024-01-01T12:00:00"),
    status: "sent",
  };

  const mockAssistantMessage: Message = {
    id: "msg-2",
    role: "assistant",
    content: "Test AI response",
    timestamp: new Date("2024-01-01T12:00:30"),
    status: "sent",
  };

  const mockMessageWithArtifact: Message = {
    id: "msg-3",
    role: "assistant",
    content: "Generated dashboard",
    artifactId: "art-123",
    schema: {
      version: "1.0",
      layout: { type: "grid", columns: 12 },
      components: [],
      data_sources: {},
    },
    timestamp: new Date("2024-01-01T12:01:00"),
    status: "sent",
  };

  it("should render user message", () => {
    render(<MessageItem message={mockUserMessage} />);

    expect(screen.getByText("Test user message")).toBeInTheDocument();
    expect(screen.getByText("あなた")).toBeInTheDocument();
  });

  it("should render assistant message", () => {
    render(<MessageItem message={mockAssistantMessage} />);

    expect(screen.getByText("Test AI response")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("should display timestamp", () => {
    render(<MessageItem message={mockUserMessage} />);

    const timestamp = screen.getByTestId("message-timestamp");
    expect(timestamp).toBeInTheDocument();
  });

  it("should call onCopy when copy button is clicked", () => {
    const mockOnCopy = vi.fn();
    render(<MessageItem message={mockUserMessage} onCopy={mockOnCopy} />);

    const copyButton = screen.getByTestId("message-copy-button");
    fireEvent.click(copyButton);

    expect(mockOnCopy).toHaveBeenCalledWith(mockUserMessage);
  });

  it("should call onDelete when delete button is clicked and confirmed", () => {
    const mockOnDelete = vi.fn();
    global.confirm = vi.fn(() => true);

    render(<MessageItem message={mockUserMessage} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByTestId("message-delete-button");
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith("msg-1");
  });

  it("should not call onDelete when delete is cancelled", () => {
    const mockOnDelete = vi.fn();
    global.confirm = vi.fn(() => false);

    render(<MessageItem message={mockUserMessage} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByTestId("message-delete-button");
    fireEvent.click(deleteButton);

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("should display error message when status is error", () => {
    const errorMessage: Message = {
      ...mockAssistantMessage,
      status: "error",
      error: "Failed to generate",
    };

    render(<MessageItem message={errorMessage} />);

    expect(screen.getByTestId("message-error")).toBeInTheDocument();
    expect(screen.getByText("Failed to generate")).toBeInTheDocument();
  });

  it("should display artifact when schema is present", () => {
    render(<MessageItem message={mockMessageWithArtifact} />);

    expect(screen.getByTestId("message-artifact")).toBeInTheDocument();
  });

  it("should toggle artifact preview when toggle button is clicked", () => {
    render(<MessageItem message={mockMessageWithArtifact} />);

    const toggleButton = screen.getByTestId("message-artifact-toggle");

    // Initially collapsed
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    // Click to expand
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("message-artifact-preview")).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
  });

  it("should call onArtifactClick when view button is clicked", () => {
    const mockOnArtifactClick = vi.fn();
    render(
      <MessageItem
        message={mockMessageWithArtifact}
        onArtifactClick={mockOnArtifactClick}
      />
    );

    // Expand artifact first
    const toggleButton = screen.getByTestId("message-artifact-toggle");
    fireEvent.click(toggleButton);

    // Click view button
    const viewButton = screen.getByTestId("message-artifact-view-button");
    fireEvent.click(viewButton);

    expect(mockOnArtifactClick).toHaveBeenCalledWith(mockMessageWithArtifact.schema);
  });

  it("should display loading indicator when status is sending", () => {
    const sendingMessage: Message = {
      ...mockUserMessage,
      status: "sending",
    };

    render(<MessageItem message={sendingMessage} />);

    expect(screen.getByTestId("message-loading")).toBeInTheDocument();
    expect(screen.getByText("送信中...")).toBeInTheDocument();
  });

  it("should display artifact ID", () => {
    render(<MessageItem message={mockMessageWithArtifact} />);

    const artifactId = screen.getByTestId("message-artifact-id");
    expect(artifactId).toHaveTextContent("ID: art-123");
  });

  it("should display schema JSON when expanded", () => {
    render(<MessageItem message={mockMessageWithArtifact} />);

    // Expand artifact
    const toggleButton = screen.getByTestId("message-artifact-toggle");
    fireEvent.click(toggleButton);

    const schemaJson = screen.getByTestId("message-artifact-json");
    expect(schemaJson).toBeInTheDocument();
    expect(schemaJson.textContent).toContain('"version": "1.0"');
  });

  it("should show checkmark after copy for 2 seconds", async () => {
    vi.useFakeTimers();
    const mockOnCopy = vi.fn();

    render(<MessageItem message={mockUserMessage} onCopy={mockOnCopy} />);

    const copyButton = screen.getByTestId("message-copy-button");
    expect(copyButton).toHaveTextContent("📋");

    fireEvent.click(copyButton);
    expect(copyButton).toHaveTextContent("✓");

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();
    });

    expect(copyButton).toHaveTextContent("📋");

    vi.useRealTimers();
  });
});
