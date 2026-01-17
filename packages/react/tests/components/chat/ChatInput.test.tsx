import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatInput } from "../../../src/components/chat/ChatInput";

describe("ChatInput", () => {
  let mockOnSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSend = vi.fn();
  });

  it("should render input textarea", () => {
    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId("chat-input-textarea");
    expect(textarea).toBeInTheDocument();
  });

  it("should render send button", () => {
    render(<ChatInput onSend={mockOnSend} />);

    const sendButton = screen.getByTestId("chat-input-send-button");
    expect(sendButton).toBeInTheDocument();
  });

  it("should call onSend when send button is clicked", () => {
    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId("chat-input-textarea");
    const sendButton = screen.getByTestId("chat-input-send-button");

    fireEvent.change(textarea, { target: { value: "Test message" } });
    fireEvent.click(sendButton);

    expect(mockOnSend).toHaveBeenCalledWith("Test message");
  });

  it("should call onSend when Enter key is pressed", () => {
    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId("chat-input-textarea");

    fireEvent.change(textarea, { target: { value: "Test message" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(mockOnSend).toHaveBeenCalledWith("Test message");
  });

  it("should not call onSend when Shift+Enter is pressed", () => {
    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId("chat-input-textarea");

    fireEvent.change(textarea, { target: { value: "Test message" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it("should clear textarea after sending message", () => {
    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId("chat-input-textarea") as HTMLTextAreaElement;
    const sendButton = screen.getByTestId("chat-input-send-button");

    fireEvent.change(textarea, { target: { value: "Test message" } });
    fireEvent.click(sendButton);

    expect(textarea.value).toBe("");
  });

  it("should not send empty message", () => {
    render(<ChatInput onSend={mockOnSend} />);

    const sendButton = screen.getByTestId("chat-input-send-button");

    fireEvent.click(sendButton);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it("should trim whitespace before sending", () => {
    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId("chat-input-textarea");
    const sendButton = screen.getByTestId("chat-input-send-button");

    fireEvent.change(textarea, { target: { value: "  Test message  " } });
    fireEvent.click(sendButton);

    expect(mockOnSend).toHaveBeenCalledWith("Test message");
  });

  it("should display character counter", () => {
    render(<ChatInput onSend={mockOnSend} maxLength={100} />);

    const counter = screen.getByTestId("chat-input-counter");
    expect(counter).toHaveTextContent("0/100");

    const textarea = screen.getByTestId("chat-input-textarea");
    fireEvent.change(textarea, { target: { value: "Test" } });

    expect(counter).toHaveTextContent("4/100");
  });

  it("should disable send button when loading", () => {
    render(<ChatInput onSend={mockOnSend} isLoading={true} />);

    const sendButton = screen.getByTestId("chat-input-send-button");
    expect(sendButton).toBeDisabled();
  });

  it("should disable textarea when loading", () => {
    render(<ChatInput onSend={mockOnSend} isLoading={true} />);

    const textarea = screen.getByTestId("chat-input-textarea");
    expect(textarea).toBeDisabled();
  });

  it("should show loading text when sending", () => {
    render(<ChatInput onSend={mockOnSend} isLoading={true} />);

    expect(screen.getByText("送信中...")).toBeInTheDocument();
  });

  it("should respect maxLength prop", () => {
    render(<ChatInput onSend={mockOnSend} maxLength={10} />);

    const textarea = screen.getByTestId("chat-input-textarea") as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(10);
  });

  it("should use custom placeholder", () => {
    render(<ChatInput onSend={mockOnSend} placeholder="Custom placeholder" />);

    const textarea = screen.getByTestId("chat-input-textarea");
    expect(textarea).toHaveAttribute("placeholder", "Custom placeholder");
  });

  it("should disable when disabled prop is true", () => {
    render(<ChatInput onSend={mockOnSend} disabled={true} />);

    const textarea = screen.getByTestId("chat-input-textarea");
    const sendButton = screen.getByTestId("chat-input-send-button");

    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });
});
