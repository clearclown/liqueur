/**
 * ArtifactPreview Component Tests
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ArtifactPreview } from "../../../src/components/chat/ArtifactPreview";
import type { LiquidViewSchema } from "@liqueur/protocol";

// Mock LiquidRenderer
vi.mock("../../../src/components/LiquidRenderer", () => ({
  LiquidRenderer: ({ schema }: { schema: LiquidViewSchema }) => (
    <div data-testid="liquid-renderer">{JSON.stringify(schema)}</div>
  ),
}));

const mockSchema: LiquidViewSchema = {
  version: "1.0",
  layout: {
    type: "grid",
    columns: 2,
    gap: 4,
  },
  components: [
    {
      type: "chart",
      variant: "bar",
      data_source: "ds1",
    },
  ],
  data_sources: {
    ds1: {
      resource: "expenses",
    },
  },
};

describe("ArtifactPreview", () => {
  describe("Rendering", () => {
    it("should render artifact preview", () => {
      render(<ArtifactPreview schema={mockSchema} />);

      expect(screen.getByTestId("artifact-preview")).toBeInTheDocument();
      expect(screen.getByTestId("artifact-preview-header")).toBeInTheDocument();
    });

    it("should render expanded by default", () => {
      render(<ArtifactPreview schema={mockSchema} />);

      expect(screen.getByTestId("artifact-preview-content")).toBeInTheDocument();
      expect(screen.getByTestId("liquid-renderer")).toBeInTheDocument();
    });

    it("should render collapsed when defaultCollapsed is true", () => {
      render(<ArtifactPreview schema={mockSchema} defaultCollapsed={true} />);

      expect(screen.queryByTestId("artifact-preview-content")).not.toBeInTheDocument();
    });

    it("should display schema metadata", () => {
      render(<ArtifactPreview schema={mockSchema} />);

      const metaSection = screen.getByTestId("artifact-preview-meta");
      expect(metaSection).toBeInTheDocument();
      expect(metaSection).toHaveTextContent("Components:1");
      expect(metaSection).toHaveTextContent("Data Sources:1");
      expect(metaSection).toHaveTextContent("Layout:grid");
    });
  });

  describe("Interactions", () => {
    it("should toggle collapsed state when toggle button is clicked", () => {
      render(<ArtifactPreview schema={mockSchema} />);

      const toggleButton = screen.getByTestId("artifact-preview-toggle");

      // 初期状態は展開
      expect(screen.getByTestId("artifact-preview-content")).toBeInTheDocument();

      // クリックして折りたたみ
      fireEvent.click(toggleButton);
      expect(screen.queryByTestId("artifact-preview-content")).not.toBeInTheDocument();

      // もう一度クリックして展開
      fireEvent.click(toggleButton);
      expect(screen.getByTestId("artifact-preview-content")).toBeInTheDocument();
    });

    it("should call onClick callback when open button is clicked", () => {
      const handleClick = vi.fn();
      render(<ArtifactPreview schema={mockSchema} onClick={handleClick} />);

      const openButton = screen.getByTestId("artifact-preview-open-button");
      fireEvent.click(openButton);

      expect(handleClick).toHaveBeenCalledWith(mockSchema);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not render open button when onClick is not provided", () => {
      render(<ArtifactPreview schema={mockSchema} />);

      expect(screen.queryByTestId("artifact-preview-open-button")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria attributes", () => {
      render(<ArtifactPreview schema={mockSchema} />);

      const toggleButton = screen.getByTestId("artifact-preview-toggle");
      expect(toggleButton).toHaveAttribute("aria-expanded", "true");
      expect(toggleButton).toHaveAttribute("aria-label");
    });

    it("should update aria-expanded when collapsed", () => {
      render(<ArtifactPreview schema={mockSchema} />);

      const toggleButton = screen.getByTestId("artifact-preview-toggle");

      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      render(<ArtifactPreview schema={mockSchema} className="custom-class" />);

      const container = screen.getByTestId("artifact-preview");
      expect(container).toHaveClass("artifact-preview");
      expect(container).toHaveClass("custom-class");
    });
  });
});
