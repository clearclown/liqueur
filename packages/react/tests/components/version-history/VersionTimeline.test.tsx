/**
 * VersionTimeline Component Tests
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VersionTimeline } from "../../../src/components/version-history/VersionTimeline";
import type { ArtifactVersion } from "@liqueur/artifact-store";
import type { LiquidViewSchema } from "@liqueur/protocol";

const mockSchema: LiquidViewSchema = {
  version: "1.0",
  layout: { type: "grid", columns: 2, gap: 16 },
  components: [],
  data_sources: {},
};

const mockVersions: ArtifactVersion[] = [
  {
    version: 1,
    schema: mockSchema,
    message: "Initial version",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    authorId: "user1",
  },
  {
    version: 2,
    schema: { ...mockSchema, layout: { type: "stack", direction: "vertical", gap: 8 } },
    message: "Changed to stack layout",
    createdAt: new Date("2024-01-02T00:00:00Z"),
    authorId: "user1",
  },
  {
    version: 3,
    schema: mockSchema,
    message: "Reverted to grid",
    createdAt: new Date("2024-01-03T00:00:00Z"),
    authorId: "user2",
  },
];

describe("VersionTimeline", () => {
  const defaultProps = {
    versions: mockVersions,
    currentVersion: 3,
  };

  describe("Rendering", () => {
    it("should render all versions", () => {
      render(<VersionTimeline {...defaultProps} />);

      expect(screen.getByText(/v1/)).toBeInTheDocument();
      expect(screen.getByText(/v2/)).toBeInTheDocument();
      expect(screen.getByText(/v3/)).toBeInTheDocument();
    });

    it("should render version messages", () => {
      render(<VersionTimeline {...defaultProps} />);

      expect(screen.getByText("Initial version")).toBeInTheDocument();
      expect(screen.getByText("Changed to stack layout")).toBeInTheDocument();
      expect(screen.getByText("Reverted to grid")).toBeInTheDocument();
    });

    it("should render dates", () => {
      render(<VersionTimeline {...defaultProps} />);

      // Dates should be displayed in Japanese locale
      const dateText = screen.getAllByText(/2024/);
      expect(dateText.length).toBeGreaterThan(0);
    });

    it("should indicate current version", () => {
      render(<VersionTimeline {...defaultProps} />);

      const currentVersionElement = screen.getByTestId("version-item-3");
      expect(currentVersionElement).toHaveClass("version-item--current");
    });

    it("should render empty state when no versions", () => {
      render(<VersionTimeline {...defaultProps} versions={[]} />);

      expect(screen.getByText(/バージョン履歴がありません/i)).toBeInTheDocument();
    });

    it("should format dates", () => {
      render(<VersionTimeline {...defaultProps} />);

      // Dates should be formatted and displayed
      const dateElements = screen.getAllByText(/202/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  describe("Interactions", () => {
    it("should call onVersionClick when version is clicked", () => {
      const onVersionClick = vi.fn();
      render(<VersionTimeline {...defaultProps} onVersionClick={onVersionClick} />);

      fireEvent.click(screen.getByText(/v1/));

      expect(onVersionClick).toHaveBeenCalledWith(1);
    });

    it("should call onRestore when restore button is clicked", () => {
      const onRestore = vi.fn();
      // Mock window.confirm
      global.confirm = vi.fn(() => true);
      render(<VersionTimeline {...defaultProps} onRestore={onRestore} />);

      const restoreButtons = screen.getAllByText(/復元/i);
      fireEvent.click(restoreButtons[0]);

      expect(onRestore).toHaveBeenCalledWith(1);
    });

    it("should not show restore button for current version", () => {
      render(<VersionTimeline {...defaultProps} onRestore={vi.fn()} />);

      const restoreButtons = screen.queryAllByTestId(/version-restore-3/);
      expect(restoreButtons.length).toBe(0);
    });

    it("should call onDelete when delete button is clicked", () => {
      const onDelete = vi.fn();
      global.confirm = vi.fn(() => true);
      render(<VersionTimeline {...defaultProps} onDelete={onDelete} />);

      const deleteButtons = screen.getAllByText(/削除/i);
      fireEvent.click(deleteButtons[0]);

      expect(onDelete).toHaveBeenCalledWith(1);
    });

    it("should not show delete button for current version", () => {
      const onDelete = vi.fn();
      render(<VersionTimeline {...defaultProps} onDelete={onDelete} />);

      // Should have delete buttons for version 1 and 2, but not 3
      const deleteButtons = screen.queryAllByText(/削除/i);
      expect(deleteButtons.length).toBe(2);
    });
  });

  describe("Accessibility", () => {
    it("should have accessible restore buttons", () => {
      render(<VersionTimeline {...defaultProps} onRestore={vi.fn()} />);

      const restoreButtons = screen.getAllByText(/復元/i);
      expect(restoreButtons.length).toBe(2); // Not for current version
    });

    it("should have accessible delete buttons", () => {
      render(<VersionTimeline {...defaultProps} onDelete={vi.fn()} />);

      const deleteButtons = screen.getAllByText(/削除/i);
      expect(deleteButtons.length).toBe(2); // Not for current version
    });
  });

  describe("Styling", () => {
    it("should apply different styles to current version", () => {
      render(<VersionTimeline {...defaultProps} />);

      const currentVersion = screen.getByTestId("version-item-3");
      const oldVersion = screen.getByTestId("version-item-1");

      expect(currentVersion).toHaveClass("version-item--current");
      expect(oldVersion).not.toHaveClass("version-item--current");
    });
  });

  describe("Edge Cases", () => {
    it("should handle versions without messages", () => {
      const versionsWithoutMessages = mockVersions.map((v) => ({ ...v, message: undefined }));
      render(<VersionTimeline {...defaultProps} versions={versionsWithoutMessages} />);

      expect(screen.getByText(/v1/)).toBeInTheDocument();
    });

    it("should handle single version", () => {
      render(<VersionTimeline {...defaultProps} versions={[mockVersions[0]]} currentVersion={1} onRestore={vi.fn()} onDelete={vi.fn()} />);

      expect(screen.getByText(/v1/)).toBeInTheDocument();
      expect(screen.queryByText(/復元/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/削除/i)).not.toBeInTheDocument();
    });

    it("should handle currentVersion as undefined", () => {
      render(<VersionTimeline {...defaultProps} currentVersion={undefined} />);

      // Should still render
      expect(screen.getByText(/v1/)).toBeInTheDocument();
    });
  });
});
