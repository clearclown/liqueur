/**
 * ConversationList Component Tests
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConversationList } from "../../../src/components/chat/ConversationList";
import type { ConversationSummary } from "../../../src/components/chat/ConversationList";

const mockConversations: ConversationSummary[] = [
  {
    id: "conv-1",
    title: "経費分析ダッシュボード",
    updatedAt: new Date(),
    messageCount: 5,
    artifactCount: 2,
  },
  {
    id: "conv-2",
    title: "売上レポート",
    updatedAt: new Date(Date.now() - 3600000), // 1時間前
    messageCount: 3,
    artifactCount: 1,
  },
  {
    id: "conv-3",
    title: "KPI監視",
    updatedAt: new Date(Date.now() - 86400000), // 1日前
    messageCount: 8,
    artifactCount: 0,
  },
];

describe("ConversationList", () => {
  const mockOnSelectConversation = vi.fn();
  const mockOnNewConversation = vi.fn();
  const mockOnDeleteConversation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render conversation list", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
      expect(screen.getByTestId("conversation-list-header")).toBeInTheDocument();
    });

    it("should render all conversations", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      expect(screen.getByTestId("conversation-item-conv-1")).toBeInTheDocument();
      expect(screen.getByTestId("conversation-item-conv-2")).toBeInTheDocument();
      expect(screen.getByTestId("conversation-item-conv-3")).toBeInTheDocument();
    });

    it("should render conversation titles", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      expect(screen.getByText("経費分析ダッシュボード")).toBeInTheDocument();
      expect(screen.getByText("売上レポート")).toBeInTheDocument();
      expect(screen.getByText("KPI監視")).toBeInTheDocument();
    });

    it("should render empty state when no conversations", () => {
      render(
        <ConversationList
          conversations={[]}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      expect(screen.getByTestId("conversation-list-empty")).toBeInTheDocument();
      expect(screen.getByText("会話履歴がありません")).toBeInTheDocument();
    });

    it("should render loading state", () => {
      render(
        <ConversationList
          conversations={[]}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
          isLoading={true}
        />
      );

      expect(screen.getByTestId("conversation-list-loading")).toBeInTheDocument();
      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });

    it("should display message count", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      expect(screen.getByText("5件")).toBeInTheDocument();
      expect(screen.getByText("3件")).toBeInTheDocument();
      expect(screen.getByText("8件")).toBeInTheDocument();
    });

    it("should display artifact count when available", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      // artifactCount > 0 のもののみ表示
      expect(screen.getByText("📊 2")).toBeInTheDocument();
      expect(screen.getByText("📊 1")).toBeInTheDocument();
    });

    it("should highlight current conversation", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          currentConversationId="conv-2"
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      const activeItem = screen.getByTestId("conversation-item-conv-2");
      expect(activeItem).toHaveClass("conversation-list-item--active");
    });

    it("should render fallback title for untitled conversation", () => {
      const conversationsWithUntitled: ConversationSummary[] = [
        {
          id: "conv-untitled",
          title: "",
          updatedAt: new Date(),
          messageCount: 1,
        },
      ];

      render(
        <ConversationList
          conversations={conversationsWithUntitled}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      expect(screen.getByText("無題の会話")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should call onSelectConversation when conversation is clicked", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      const conversationItem = screen.getByTestId("conversation-item-conv-1");
      fireEvent.click(conversationItem);

      expect(mockOnSelectConversation).toHaveBeenCalledWith("conv-1");
      expect(mockOnSelectConversation).toHaveBeenCalledTimes(1);
    });

    it("should call onNewConversation when new button is clicked", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      const newButton = screen.getByTestId("conversation-list-new-button");
      fireEvent.click(newButton);

      expect(mockOnNewConversation).toHaveBeenCalledTimes(1);
    });

    it("should call onDeleteConversation when delete button is clicked", () => {
      // confirmをモック
      window.confirm = vi.fn(() => true);

      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
          onDeleteConversation={mockOnDeleteConversation}
        />
      );

      const deleteButton = screen.getByTestId("conversation-delete-conv-1");
      fireEvent.click(deleteButton);

      expect(mockOnDeleteConversation).toHaveBeenCalledWith("conv-1");
    });

    it("should not call onDeleteConversation when confirm is cancelled", () => {
      window.confirm = vi.fn(() => false);

      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
          onDeleteConversation={mockOnDeleteConversation}
        />
      );

      const deleteButton = screen.getByTestId("conversation-delete-conv-1");
      fireEvent.click(deleteButton);

      expect(mockOnDeleteConversation).not.toHaveBeenCalled();
    });

    it("should not render delete button when onDeleteConversation is not provided", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      expect(screen.queryByTestId("conversation-delete-conv-1")).not.toBeInTheDocument();
    });

    it("should support keyboard navigation", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      const conversationItem = screen.getByTestId("conversation-item-conv-1");
      fireEvent.keyDown(conversationItem, { key: "Enter" });

      expect(mockOnSelectConversation).toHaveBeenCalledWith("conv-1");
    });

    it("should support space key navigation", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      const conversationItem = screen.getByTestId("conversation-item-conv-2");
      fireEvent.keyDown(conversationItem, { key: " " });

      expect(mockOnSelectConversation).toHaveBeenCalledWith("conv-2");
    });
  });

  describe("Date Formatting", () => {
    it("should display relative time for recent updates", () => {
      const recentConversation: ConversationSummary[] = [
        {
          id: "conv-recent",
          title: "最近の会話",
          updatedAt: new Date(Date.now() - 30000), // 30秒前
          messageCount: 1,
        },
      ];

      render(
        <ConversationList
          conversations={recentConversation}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      expect(screen.getByText("たった今")).toBeInTheDocument();
    });

    it("should display minutes for updates within an hour", () => {
      const minutesAgoConversation: ConversationSummary[] = [
        {
          id: "conv-mins",
          title: "数分前の会話",
          updatedAt: new Date(Date.now() - 1800000), // 30分前
          messageCount: 1,
        },
      ];

      render(
        <ConversationList
          conversations={minutesAgoConversation}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      expect(screen.getByText("30分前")).toBeInTheDocument();
    });

    it("should display hours for updates within a day", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      // 1時間前のもの
      expect(screen.getByText("1時間前")).toBeInTheDocument();
    });

    it("should display days for updates within a week", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      // 1日前のもの
      expect(screen.getByText("1日前")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria attributes on items", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          currentConversationId="conv-1"
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      const currentItem = screen.getByTestId("conversation-item-conv-1");
      expect(currentItem).toHaveAttribute("role", "button");
      expect(currentItem).toHaveAttribute("tabIndex", "0");
      expect(currentItem).toHaveAttribute("aria-current", "true");
    });

    it("should have proper aria-label on new button", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
        />
      );

      const newButton = screen.getByTestId("conversation-list-new-button");
      expect(newButton).toHaveAttribute("aria-label", "新しい会話を開始");
    });

    it("should disable new button when loading", () => {
      render(
        <ConversationList
          conversations={[]}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
          isLoading={true}
        />
      );

      const newButton = screen.getByTestId("conversation-list-new-button");
      expect(newButton).toBeDisabled();
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockOnSelectConversation}
          onNewConversation={mockOnNewConversation}
          className="custom-class"
        />
      );

      const container = screen.getByTestId("conversation-list");
      expect(container).toHaveClass("conversation-list");
      expect(container).toHaveClass("custom-class");
    });
  });
});
