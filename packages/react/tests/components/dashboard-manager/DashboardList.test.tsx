import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DashboardList } from "../../../src/components/dashboard-manager/DashboardList";
import type { Dashboard } from "../../../src/types/dashboard";

describe("DashboardList", () => {
  const mockDashboards: Dashboard[] = [
    {
      id: "dashboard-1",
      title: "Sales Dashboard",
      description: "Monthly sales overview",
      schema: { version: "1.0", components: [], data_sources: {} },
      tags: ["sales", "monthly"],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-15"),
      favorite: true,
    },
    {
      id: "dashboard-2",
      title: "Expenses Dashboard",
      description: "Track expenses",
      schema: { version: "1.0", components: [], data_sources: {} },
      tags: ["expenses"],
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-10"),
      favorite: false,
    },
  ];

  describe("Loading State", () => {
    it("should display loading message when isLoading is true", () => {
      render(<DashboardList dashboards={[]} isLoading={true} />);

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("Loading dashboards...")).toBeInTheDocument();
    });

    it("should have aria-live attribute for loading state", () => {
      render(<DashboardList dashboards={[]} isLoading={true} />);

      const loadingDiv = screen.getByRole("status");
      expect(loadingDiv).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("Error State", () => {
    it("should display error message when error is provided", () => {
      const error = new Error("Failed to load dashboards");
      render(<DashboardList dashboards={[]} error={error} />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/Error: Failed to load dashboards/)).toBeInTheDocument();
    });

    it("should style error text in red", () => {
      const error = new Error("Network error");
      render(<DashboardList dashboards={[]} error={error} />);

      const errorText = screen.getByText(/Error:/);
      expect(errorText).toHaveStyle({ color: "#d32f2f" });
    });
  });

  describe("Empty State", () => {
    it("should display empty message when dashboards array is empty", () => {
      render(<DashboardList dashboards={[]} />);

      expect(screen.getByText(/No dashboards found/)).toBeInTheDocument();
      expect(screen.getByText(/Create your first dashboard to get started!/)).toBeInTheDocument();
    });

    it("should style empty message with gray color and centered text", () => {
      render(<DashboardList dashboards={[]} />);

      const emptyMessage = screen.getByText(/No dashboards found/);
      expect(emptyMessage).toHaveStyle({
        color: "#666",
        textAlign: "center",
        padding: "32px",
      });
    });
  });

  describe("Dashboard Grid", () => {
    it("should render all dashboards in a grid layout", () => {
      render(<DashboardList dashboards={mockDashboards} />);

      expect(screen.getByText("Sales Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Expenses Dashboard")).toBeInTheDocument();
    });

    it("should apply grid styling", () => {
      const { container } = render(<DashboardList dashboards={mockDashboards} />);

      const gridDiv = container.querySelector(".dashboard-list");
      expect(gridDiv).toHaveStyle({
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "16px",
        padding: "16px 0",
      });
    });

    it("should apply custom className", () => {
      const { container } = render(
        <DashboardList dashboards={mockDashboards} className="custom-class" />
      );

      const gridDiv = container.querySelector(".dashboard-list.custom-class");
      expect(gridDiv).toBeInTheDocument();
    });
  });

  describe("Event Handlers", () => {
    it("should call onSelect when dashboard card is clicked", () => {
      const onSelect = vi.fn();
      render(<DashboardList dashboards={mockDashboards} onSelect={onSelect} />);

      const salesCard = screen.getByText("Sales Dashboard").closest("article");
      salesCard?.click();

      expect(onSelect).toHaveBeenCalledWith(mockDashboards[0]);
    });

    it("should call onFavoriteToggle when favorite button is clicked", () => {
      const onFavoriteToggle = vi.fn();
      render(<DashboardList dashboards={mockDashboards} onFavoriteToggle={onFavoriteToggle} />);

      const favoriteButtons = screen.getAllByRole("button", { name: /favorite/ });
      favoriteButtons[0].click();

      expect(onFavoriteToggle).toHaveBeenCalledWith("dashboard-1");
    });

    it("should call onEdit when edit button is clicked", () => {
      const onEdit = vi.fn();
      render(<DashboardList dashboards={mockDashboards} onEdit={onEdit} />);

      const editButtons = screen.getAllByRole("button", { name: /Edit/ });
      editButtons[0].click();

      expect(onEdit).toHaveBeenCalledWith(mockDashboards[0]);
    });

    it("should call onDelete when delete button is clicked", () => {
      const onDelete = vi.fn();
      render(<DashboardList dashboards={mockDashboards} onDelete={onDelete} />);

      const deleteButtons = screen.getAllByRole("button", { name: /Delete/ });
      deleteButtons[0].click();

      expect(onDelete).toHaveBeenCalledWith("dashboard-1");
    });
  });

  describe("Custom Card Renderer", () => {
    it("should use renderCard prop when provided", () => {
      const renderCard = vi.fn((dashboard: Dashboard) => (
        <div key={dashboard.id} data-testid={`custom-card-${dashboard.id}`}>
          {dashboard.title}
        </div>
      ));

      render(<DashboardList dashboards={mockDashboards} renderCard={renderCard} />);

      expect(screen.getByTestId("custom-card-dashboard-1")).toBeInTheDocument();
      expect(screen.getByTestId("custom-card-dashboard-2")).toBeInTheDocument();
      expect(renderCard).toHaveBeenCalledTimes(2);
    });

    it("should pass dashboard data to renderCard function", () => {
      const renderCard = vi.fn((dashboard: Dashboard) => (
        <div key={dashboard.id}>{dashboard.title}</div>
      ));

      render(<DashboardList dashboards={mockDashboards} renderCard={renderCard} />);

      expect(renderCard).toHaveBeenCalledWith(mockDashboards[0]);
      expect(renderCard).toHaveBeenCalledWith(mockDashboards[1]);
    });
  });

  describe("Priority States", () => {
    it("should prioritize loading state over error state", () => {
      const error = new Error("Test error");
      render(<DashboardList dashboards={[]} isLoading={true} error={error} />);

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should prioritize error state over empty state", () => {
      const error = new Error("Test error");
      render(<DashboardList dashboards={[]} error={error} />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.queryByText(/No dashboards found/)).not.toBeInTheDocument();
    });

    it("should prioritize empty state over dashboard grid when array is empty", () => {
      render(<DashboardList dashboards={[]} />);

      expect(screen.getByText(/No dashboards found/)).toBeInTheDocument();
      expect(screen.queryByText("Sales Dashboard")).not.toBeInTheDocument();
    });
  });
});
