/**
 * VersionDiff Component Tests
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VersionDiff } from "../../../src/components/version-history/VersionDiff";
import type { VersionDiff as VersionDiffType } from "@liqueur/artifact-store";

const mockDiff: VersionDiffType = {
  fromVersion: 1,
  toVersion: 2,
  changes: [
    {
      type: "add",
      path: "components[0]",
      newValue: { type: "chart", chart_type: "bar" },
      description: "Added chart component",
    },
    {
      type: "remove",
      path: "components[1]",
      oldValue: { type: "table" },
      description: "Removed table component",
    },
    {
      type: "modify",
      path: "layout.type",
      oldValue: "grid",
      newValue: "stack",
      description: "Changed layout type from grid to stack",
    },
  ],
};

describe("VersionDiff", () => {
  const defaultProps = {
    diff: mockDiff,
  };

  describe("Rendering", () => {
    it("should render diff header", () => {
      render(<VersionDiff {...defaultProps} />);

      expect(screen.getByText(/v1 → v2/i)).toBeInTheDocument();
      expect(screen.getByText(/3 changes/i)).toBeInTheDocument();
    });

    it("should render all changes", () => {
      render(<VersionDiff {...defaultProps} />);

      expect(screen.getByText(/Added chart component/i)).toBeInTheDocument();
      expect(screen.getByText(/Removed table component/i)).toBeInTheDocument();
      expect(screen.getByText(/Changed layout type/i)).toBeInTheDocument();
    });

    it("should render change types with different styles", () => {
      render(<VersionDiff {...defaultProps} />);

      const addChange = screen.getByTestId("diff-change-0");
      const removeChange = screen.getByTestId("diff-change-1");
      const modifyChange = screen.getByTestId("diff-change-2");

      expect(addChange).toHaveClass("diff-change--add");
      expect(removeChange).toHaveClass("diff-change--remove");
      expect(modifyChange).toHaveClass("diff-change--modify");
    });

    it("should render paths", () => {
      render(<VersionDiff {...defaultProps} />);

      expect(screen.getByText(/components\[0\]/i)).toBeInTheDocument();
      expect(screen.getByText(/components\[1\]/i)).toBeInTheDocument();
      expect(screen.getByText(/layout\.type/i)).toBeInTheDocument();
    });

    it("should render old and new values for modifications", () => {
      render(<VersionDiff {...defaultProps} />);

      expect(screen.getByText(/grid/i)).toBeInTheDocument();
      expect(screen.getByText(/stack/i)).toBeInTheDocument();
    });

    it("should render empty state when no changes", () => {
      const emptyDiff: VersionDiffType = {
        fromVersion: 1,
        toVersion: 2,
        changes: [],
      };

      render(<VersionDiff diff={emptyDiff} />);

      expect(screen.getByText(/変更はありません/i)).toBeInTheDocument();
    });
  });

  describe("Full JSON Mode", () => {
    it("should show full JSON when showFullJson is true", () => {
      render(<VersionDiff {...defaultProps} showFullJson={true} />);

      // Should show JSON representation
      const jsonElements = screen.getAllByText(/\{|\}/);
      expect(jsonElements.length).toBeGreaterThan(0);
    });

    it("should not show full JSON by default", () => {
      render(<VersionDiff {...defaultProps} />);

      // Should show descriptions, not full JSON
      expect(screen.getByText(/Added chart component/i)).toBeInTheDocument();
    });
  });

  describe("Change Type Rendering", () => {
    it("should render add changes correctly", () => {
      const addOnlyDiff: VersionDiffType = {
        fromVersion: 1,
        toVersion: 2,
        changes: [
          {
            type: "add",
            path: "new.field",
            newValue: "value",
            description: "Added new field",
          },
        ],
      };

      render(<VersionDiff diff={addOnlyDiff} />);

      expect(screen.getByText(/Added new field/i)).toBeInTheDocument();
      expect(screen.getByText(/追加/i)).toBeInTheDocument();
    });

    it("should render remove changes correctly", () => {
      const removeOnlyDiff: VersionDiffType = {
        fromVersion: 1,
        toVersion: 2,
        changes: [
          {
            type: "remove",
            path: "old.field",
            oldValue: "value",
            description: "Removed old field",
          },
        ],
      };

      render(<VersionDiff diff={removeOnlyDiff} />);

      expect(screen.getByText(/Removed old field/i)).toBeInTheDocument();
      expect(screen.getByText(/削除/i)).toBeInTheDocument();
    });

    it("should render modify changes correctly", () => {
      const modifyOnlyDiff: VersionDiffType = {
        fromVersion: 1,
        toVersion: 2,
        changes: [
          {
            type: "modify",
            path: "field",
            oldValue: "old",
            newValue: "new",
            description: "Modified field",
          },
        ],
      };

      render(<VersionDiff diff={modifyOnlyDiff} />);

      expect(screen.getByText(/Modified field/i)).toBeInTheDocument();
      expect(screen.getByText(/~ 変更/i)).toBeInTheDocument();
    });
  });

  describe("Complex Values", () => {
    it("should render object values", () => {
      const objectDiff: VersionDiffType = {
        fromVersion: 1,
        toVersion: 2,
        changes: [
          {
            type: "add",
            path: "component",
            newValue: { type: "chart", config: { width: 100 } },
            description: "Added component",
          },
        ],
      };

      render(<VersionDiff diff={objectDiff} />);

      expect(screen.getByText(/Added component/i)).toBeInTheDocument();
    });

    it("should render array values", () => {
      const arrayDiff: VersionDiffType = {
        fromVersion: 1,
        toVersion: 2,
        changes: [
          {
            type: "modify",
            path: "items",
            oldValue: [1, 2, 3],
            newValue: [1, 2, 3, 4],
            description: "Added item to array",
          },
        ],
      };

      render(<VersionDiff diff={arrayDiff} />);

      expect(screen.getByText(/Added item to array/i)).toBeInTheDocument();
    });

    it("should handle null values", () => {
      const nullDiff: VersionDiffType = {
        fromVersion: 1,
        toVersion: 2,
        changes: [
          {
            type: "modify",
            path: "field",
            oldValue: "value",
            newValue: null,
            description: "Set to null",
          },
        ],
      };

      render(<VersionDiff diff={nullDiff} />);

      expect(screen.getByText(/Set to null/i)).toBeInTheDocument();
      expect(screen.getByText(/null/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should render change types", () => {
      render(<VersionDiff {...defaultProps} />);

      // Change type indicators should be visible
      expect(screen.getByText(/\+ 追加/i)).toBeInTheDocument();
      expect(screen.getByText(/- 削除/i)).toBeInTheDocument();
      expect(screen.getByText(/~ 変更/i)).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply different styles to different change types", () => {
      render(<VersionDiff {...defaultProps} />);

      const addChange = screen.getByTestId("diff-change-0");
      const removeChange = screen.getByTestId("diff-change-1");
      const modifyChange = screen.getByTestId("diff-change-2");

      // Each should have type-specific class
      expect(addChange).toHaveClass("diff-change--add");
      expect(removeChange).toHaveClass("diff-change--remove");
      expect(modifyChange).toHaveClass("diff-change--modify");
    });
  });

  describe("Edge Cases", () => {
    it("should handle changes without descriptions", () => {
      const noDescDiff: VersionDiffType = {
        fromVersion: 1,
        toVersion: 2,
        changes: [
          {
            type: "add",
            path: "field",
            newValue: "value",
          },
        ],
      };

      render(<VersionDiff diff={noDescDiff} />);

      expect(screen.getByText(/field/i)).toBeInTheDocument();
    });

    it("should handle deeply nested paths", () => {
      const deepDiff: VersionDiffType = {
        fromVersion: 1,
        toVersion: 2,
        changes: [
          {
            type: "modify",
            path: "layout.components[0].config.options.chart.type",
            oldValue: "bar",
            newValue: "line",
            description: "Changed chart type",
          },
        ],
      };

      render(<VersionDiff diff={deepDiff} />);

      expect(screen.getByText(/layout\.components/i)).toBeInTheDocument();
    });

    it("should handle special characters in paths", () => {
      const specialDiff: VersionDiffType = {
        fromVersion: 1,
        toVersion: 2,
        changes: [
          {
            type: "add",
            path: "field-with-dashes.and_underscores[0]",
            newValue: "value",
            description: "Added special field",
          },
        ],
      };

      render(<VersionDiff diff={specialDiff} />);

      expect(screen.getByText(/field-with-dashes/i)).toBeInTheDocument();
    });
  });
});
