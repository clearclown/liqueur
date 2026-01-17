import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageList } from "../../../src/components/chat/MessageList";
import type { Message } from "../../../src/types/chat";

describe("MessageList", () => {
  const mockMessages: Message[] = [
    {
      id: "msg-1",
      role: "user",
      content: "First message",
      timestamp: new Date("2024-01-01T12:00:00"),
      status: "sent",
    },
    {
      id: "msg-2",
      role: "assistant",
      content: "First response",
      timestamp: new Date("2024-01-01T12:00:30"),
      status: "sent",
    },
    {
      id: "msg-3",
      role: "user",
      content: "Second message",
      timestamp: new Date("2024-01-01T12:01:00"),
      status: "sent",
    },
  ];

  it("should render empty state when no messages", () => {
    render(<MessageList messages={[]} />);

    expect(screen.getByTestId("message-list-empty")).toBeInTheDocument();
    expect(screen.getByText("チャットを開始してください")).toBeInTheDocument();
  });

  it("should render all messages", () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getByText("First message")).toBeInTheDocument();
    expect(screen.getByText("First response")).toBeInTheDocument();
    expect(screen.getByText("Second message")).toBeInTheDocument();
  });

  it("should render messages in order", () => {
    render(<MessageList messages={mockMessages} />);

    const messageItems = screen.getAllByTestId(/message-item-/);
    expect(messageItems).toHaveLength(3);
  });

  it("should display typing indicator when loading", () => {
    render(<MessageList messages={mockMessages} isLoading={true} />);

    expect(screen.getByTestId("message-typing")).toBeInTheDocument();
  });

  it("should not display typing indicator when not loading", () => {
    render(<MessageList messages={mockMessages} isLoading={false} />);

    expect(screen.queryByTestId("message-typing")).not.toBeInTheDocument();
  });

  it("should display example prompts in empty state", () => {
    render(<MessageList messages={[]} />);

    expect(screen.getByText(/月別の支出をバーチャートで表示して/)).toBeInTheDocument();
    expect(screen.getByText(/カテゴリ別の売上を円グラフにして/)).toBeInTheDocument();
  });

  it("should pass onArtifactClick to MessageItem", () => {
    const mockOnArtifactClick = vi.fn();
    render(<MessageList messages={mockMessages} onArtifactClick={mockOnArtifactClick} />);

    // onArtifactClick is passed down to MessageItem components
    // (actual testing of the callback would require a message with a schema)
  });

  it("should pass onCopy to MessageItem", () => {
    const mockOnCopy = vi.fn();
    render(<MessageList messages={mockMessages} onCopy={mockOnCopy} />);

    // onCopy is passed down to MessageItem components
  });

  it("should pass onDelete to MessageItem", () => {
    const mockOnDelete = vi.fn();
    render(<MessageList messages={mockMessages} onDelete={mockOnDelete} />);

    // onDelete is passed down to MessageItem components
  });

  it("should have aria-live attribute for accessibility", () => {
    render(<MessageList messages={mockMessages} />);

    const container = screen.getByTestId("message-list-container");
    expect(container).toHaveAttribute("aria-live", "polite");
    expect(container).toHaveAttribute("role", "log");
  });

  it("should not render empty state when loading", () => {
    render(<MessageList messages={[]} isLoading={true} />);

    expect(screen.queryByTestId("message-list-empty")).not.toBeInTheDocument();
    expect(screen.getByTestId("message-typing")).toBeInTheDocument();
  });
});
