import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardCard } from "../../../src/components/dashboard-manager/DashboardCard";
import type { Dashboard } from "../../../src/types";

const mockDashboard: Dashboard = {
  id: "dashboard-1",
  userId: "user1",
  title: "Monthly Expenses",
  description: "Track monthly expenses excluding travel",
  schema: {
    version: "1.0",
    layout: { type: "grid", columns: 12 },
    components: [],
  },
  version: 1,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-02T00:00:00Z"),
  tags: ["expenses", "monthly"],
  visibility: "private",
  favorite: false,
};

describe("DashboardCard", () => {
  it("should render dashboard title and description", () => {
    render(<DashboardCard dashboard={mockDashboard} />);

    expect(screen.getByText("Monthly Expenses")).toBeInTheDocument();
    expect(screen.getByText("Track monthly expenses excluding travel")).toBeInTheDocument();
  });

  it("should render without description when not provided", () => {
    const dashboardWithoutDesc = { ...mockDashboard, description: undefined };
    render(<DashboardCard dashboard={dashboardWithoutDesc} />);

    expect(screen.getByText("Monthly Expenses")).toBeInTheDocument();
    expect(screen.queryByText("Track monthly expenses excluding travel")).not.toBeInTheDocument();
  });

  it("should display formatted dates", () => {
    render(<DashboardCard dashboard={mockDashboard} />);

    // Check that dates are displayed (exact format may vary)
    const dateElements = screen.getAllByText(/2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it("should call onSelect when card is clicked", () => {
    const onSelect = vi.fn();
    render(<DashboardCard dashboard={mockDashboard} onSelect={onSelect} />);

    const card = screen.getByRole("article");
    fireEvent.click(card);

    expect(onSelect).toHaveBeenCalledWith(mockDashboard);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("should call onFavoriteToggle when favorite button is clicked", () => {
    const onFavoriteToggle = vi.fn();
    render(<DashboardCard dashboard={mockDashboard} onFavoriteToggle={onFavoriteToggle} />);

    const favoriteButton = screen.getByRole("button", { name: /favorite/i });
    fireEvent.click(favoriteButton);

    expect(onFavoriteToggle).toHaveBeenCalledWith("dashboard-1");
    expect(onFavoriteToggle).toHaveBeenCalledTimes(1);
  });

  it("should call onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();
    render(<DashboardCard dashboard={mockDashboard} onEdit={onEdit} />);

    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockDashboard);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("should call onDelete when delete button is clicked", () => {
    const onDelete = vi.fn();
    render(<DashboardCard dashboard={mockDashboard} onDelete={onDelete} />);

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith("dashboard-1");
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("should show favorite state correctly", () => {
    const favoriteDashboard = { ...mockDashboard, favorite: true };
    render(<DashboardCard dashboard={favoriteDashboard} />);

    const favoriteButton = screen.getByRole("button", { name: /favorite/i });
    expect(favoriteButton).toHaveAttribute("aria-pressed", "true");
  });

  it("should not call onSelect when action buttons are clicked", () => {
    const onSelect = vi.fn();
    const onFavoriteToggle = vi.fn();
    render(
      <DashboardCard
        dashboard={mockDashboard}
        onSelect={onSelect}
        onFavoriteToggle={onFavoriteToggle}
      />
    );

    const favoriteButton = screen.getByRole("button", { name: /favorite/i });
    fireEvent.click(favoriteButton);

    expect(onFavoriteToggle).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("should render tags", () => {
    render(<DashboardCard dashboard={mockDashboard} />);

    expect(screen.getByText("expenses")).toBeInTheDocument();
    expect(screen.getByText("monthly")).toBeInTheDocument();
  });

  it("should be accessible", () => {
    render(<DashboardCard dashboard={mockDashboard} />);

    const card = screen.getByRole("article");
    expect(card).toHaveAttribute("aria-label", expect.stringContaining("Monthly Expenses"));
  });
});
