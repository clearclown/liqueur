/**
 * AI Generation Form UI Tests
 * AI生成フォームコンポーネントのユニットテスト
 *
 * TDD Approach: Red-Green-Refactor
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import GenerateForm from "../components/GenerateForm";
import type { DatabaseMetadata } from "@liqueur/protocol";

/**
 * Test Data: Database Metadata
 */
const mockMetadata: DatabaseMetadata = {
  tables: [
    {
      name: "expenses",
      description: "Expense transactions",
      columns: [
        { name: "id", type: "integer", nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: "category", type: "text", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "amount", type: "decimal", nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
  ],
};

describe("GenerateForm", () => {
  describe("TC-UI-GEN-001: Form Rendering", () => {
    it("should render prompt input field", () => {
      render(<GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} />);

      const input = screen.getByPlaceholderText(/enter your request/i);
      expect(input).toBeInTheDocument();
    });

    it("should render generate button", () => {
      render(<GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} />);

      const button = screen.getByRole("button", { name: /generate/i });
      expect(button).toBeInTheDocument();
    });

    it("should display database tables in metadata section", () => {
      render(<GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} />);

      expect(screen.getByText(/expenses/i)).toBeInTheDocument();
    });
  });

  describe("TC-UI-GEN-002: User Interaction", () => {
    it("should update prompt value on input", () => {
      render(<GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} />);

      const input = screen.getByPlaceholderText(/enter your request/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Show me expenses" } });

      expect(input.value).toBe("Show me expenses");
    });

    it("should call onGenerate with prompt when button clicked", async () => {
      const onGenerate = vi.fn();
      render(<GenerateForm metadata={mockMetadata} onGenerate={onGenerate} />);

      const input = screen.getByPlaceholderText(/enter your request/i);
      fireEvent.change(input, { target: { value: "Show me expenses" } });

      const button = screen.getByRole("button", { name: /generate/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(onGenerate).toHaveBeenCalledWith("Show me expenses", mockMetadata);
      });
    });

    it("should disable button when prompt is empty", () => {
      render(<GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} />);

      const button = screen.getByRole("button", { name: /generate/i });
      expect(button).toBeDisabled();
    });

    it("should enable button when prompt has value", () => {
      render(<GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} />);

      const input = screen.getByPlaceholderText(/enter your request/i);
      fireEvent.change(input, { target: { value: "Show me expenses" } });

      const button = screen.getByRole("button", { name: /generate/i });
      expect(button).toBeEnabled();
    });
  });

  describe("TC-UI-GEN-003: Loading State", () => {
    it("should show loading indicator during generation", () => {
      render(<GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} loading={true} />);

      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });

    it("should disable button during generation", () => {
      render(<GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} loading={true} />);

      const button = screen.getByRole("button", { name: /generating/i });
      expect(button).toBeDisabled();
    });

    it("should hide loading indicator when not loading", () => {
      render(<GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} loading={false} />);

      expect(screen.queryByText(/generating/i)).not.toBeInTheDocument();
    });
  });

  describe("TC-UI-GEN-004: Error Handling", () => {
    it("should display error message when error prop is provided", () => {
      render(
        <GenerateForm
          metadata={mockMetadata}
          onGenerate={vi.fn()}
          error="Failed to generate schema"
        />
      );

      expect(screen.getByText(/failed to generate schema/i)).toBeInTheDocument();
    });

    it("should not display error when error prop is null", () => {
      render(<GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} error={null} />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should clear prompt on successful generation", async () => {
      const { rerender } = render(
        <GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} />
      );

      const input = screen.getByPlaceholderText(/enter your request/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Show me expenses" } });

      // シミュレート: 生成成功
      rerender(
        <GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} success={true} />
      );

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });
  });

  describe("TC-UI-GEN-005: Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} />);

      const input = screen.getByLabelText(/prompt/i);
      expect(input).toBeInTheDocument();
    });

    it.skip("should have keyboard navigation support", () => {
      // Note: Tab navigation is not accurately simulated in jsdom
      // This test should be performed in E2E tests with a real browser
      render(<GenerateForm metadata={mockMetadata} onGenerate={vi.fn()} />);

      const input = screen.getByPlaceholderText(/enter your request/i);
      const button = screen.getByRole("button", { name: /generate/i });

      input.focus();
      expect(document.activeElement).toBe(input);

      fireEvent.keyDown(input, { key: "Tab" });
      expect(document.activeElement).toBe(button);
    });
  });
});
