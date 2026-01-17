/**
 * TypingIndicator Component Tests
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TypingIndicator } from "../../../src/components/chat/TypingIndicator";

describe("TypingIndicator", () => {
  describe("Rendering", () => {
    it("should render typing indicator", () => {
      render(<TypingIndicator />);

      expect(screen.getByTestId("typing-indicator")).toBeInTheDocument();
    });

    it("should render default message", () => {
      render(<TypingIndicator />);

      expect(screen.getByText("AI is thinking...")).toBeInTheDocument();
    });

    it("should render custom message", () => {
      render(<TypingIndicator message="カスタムメッセージ" />);

      expect(screen.getByText("カスタムメッセージ")).toBeInTheDocument();
    });

    it("should render avatar", () => {
      render(<TypingIndicator />);

      expect(screen.getByTestId("typing-indicator-avatar")).toBeInTheDocument();
      expect(screen.getByTestId("typing-indicator-avatar")).toHaveTextContent("🤖");
    });

    it("should render three bubbles", () => {
      render(<TypingIndicator />);

      const bubbles = screen.getByTestId("typing-indicator-bubbles");
      expect(bubbles).toBeInTheDocument();

      // 3つの bubble が存在することを確認
      const bubbleElements = bubbles.querySelectorAll(".typing-indicator-bubble");
      expect(bubbleElements).toHaveLength(3);
    });
  });

  describe("Accessibility", () => {
    it("should have role status", () => {
      render(<TypingIndicator />);

      const indicator = screen.getByTestId("typing-indicator");
      expect(indicator).toHaveAttribute("role", "status");
    });

    it("should have aria-label", () => {
      const message = "Loading...";
      render(<TypingIndicator message={message} />);

      const indicator = screen.getByTestId("typing-indicator");
      expect(indicator).toHaveAttribute("aria-label", message);
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      render(<TypingIndicator className="custom-class" />);

      const indicator = screen.getByTestId("typing-indicator");
      expect(indicator).toHaveClass("typing-indicator");
      expect(indicator).toHaveClass("custom-class");
    });
  });
});
