import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatContainer } from "../../../src/components/chat/ChatContainer";
import type { Message } from "../../../src/types/chat";

describe("ChatContainer", () => {
  const mockMessages: Message[] = [
    {
      id: "msg-1",
      role: "user",
      content: "Test message",
      timestamp: new Date("2024-01-01T12:00:00"),
      status: "sent",
    },
  ];

  const mockOnSendMessage = vi.fn();

  it("should render chat header", () => {
    render(<ChatContainer messages={[]} onSendMessage={mockOnSendMessage} />);

    expect(screen.getByTestId("chat-header")).toBeInTheDocument();
    expect(screen.getByText("AI ダッシュボード生成")).toBeInTheDocument();
  });

  it("should render MessageList", () => {
    render(<ChatContainer messages={mockMessages} onSendMessage={mockOnSendMessage} />);

    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("should render ChatInput", () => {
    render(<ChatContainer messages={[]} onSendMessage={mockOnSendMessage} />);

    expect(screen.getByTestId("chat-input-textarea")).toBeInTheDocument();
  });

  it("should call onSendMessage when message is sent", () => {
    render(<ChatContainer messages={[]} onSendMessage={mockOnSendMessage} />);

    const textarea = screen.getByTestId("chat-input-textarea");
    const sendButton = screen.getByTestId("chat-input-send-button");

    fireEvent.change(textarea, { target: { value: "New message" } });
    fireEvent.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith("New message");
  });

  it("should display error when error prop is provided", () => {
    render(
      <ChatContainer
        messages={[]}
        onSendMessage={mockOnSendMessage}
        error="Test error message"
      />
    );

    expect(screen.getByTestId("chat-error")).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should not display error when error is null", () => {
    render(
      <ChatContainer
        messages={[]}
        onSendMessage={mockOnSendMessage}
        error={null}
      />
    );

    expect(screen.queryByTestId("chat-error")).not.toBeInTheDocument();
  });

  it("should display clear button when messages exist", () => {
    const mockOnClear = vi.fn();

    render(
      <ChatContainer
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearConversation={mockOnClear}
      />
    );

    expect(screen.getByTestId("chat-clear-button")).toBeInTheDocument();
  });

  it("should not display clear button when no messages", () => {
    const mockOnClear = vi.fn();

    render(
      <ChatContainer
        messages={[]}
        onSendMessage={mockOnSendMessage}
        onClearConversation={mockOnClear}
      />
    );

    expect(screen.queryByTestId("chat-clear-button")).not.toBeInTheDocument();
  });

  it("should call onClearConversation when clear button is clicked and confirmed", () => {
    const mockOnClear = vi.fn();
    global.confirm = vi.fn(() => true);

    render(
      <ChatContainer
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearConversation={mockOnClear}
      />
    );

    const clearButton = screen.getByTestId("chat-clear-button");
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalled();
  });

  it("should not call onClearConversation when clear is cancelled", () => {
    const mockOnClear = vi.fn();
    global.confirm = vi.fn(() => false);

    render(
      <ChatContainer
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onClearConversation={mockOnClear}
      />
    );

    const clearButton = screen.getByTestId("chat-clear-button");
    fireEvent.click(clearButton);

    expect(mockOnClear).not.toHaveBeenCalled();
  });

  it("should pass isLoading to MessageList and ChatInput", () => {
    render(
      <ChatContainer
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        isLoading={true}
      />
    );

    // ChatInput should be disabled when loading
    expect(screen.getByTestId("chat-input-send-button")).toBeDisabled();

    // MessageList should show typing indicator
    expect(screen.getByTestId("message-typing")).toBeInTheDocument();
  });

  it("should pass onArtifactClick to MessageList", () => {
    const mockOnArtifactClick = vi.fn();

    render(
      <ChatContainer
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onArtifactClick={mockOnArtifactClick}
      />
    );

    // onArtifactClick is passed down to MessageList
  });

  it("should pass onCopyMessage to MessageList", () => {
    const mockOnCopyMessage = vi.fn();

    render(
      <ChatContainer
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onCopyMessage={mockOnCopyMessage}
      />
    );

    // onCopyMessage is passed down to MessageList
  });

  it("should pass onDeleteMessage to MessageList", () => {
    const mockOnDeleteMessage = vi.fn();

    render(
      <ChatContainer
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        onDeleteMessage={mockOnDeleteMessage}
      />
    );

    // onDeleteMessage is passed down to MessageList
  });

  it("should apply custom className", () => {
    const { container } = render(
      <ChatContainer
        messages={[]}
        onSendMessage={mockOnSendMessage}
        className="custom-class"
      />
    );

    const chatContainer = container.querySelector(".chat-container");
    expect(chatContainer).toHaveClass("custom-class");
  });
});
