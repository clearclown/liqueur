import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DashboardSearch } from "../../../src/components/dashboard-manager/DashboardSearch";

describe("DashboardSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const defaultProps = {
    onSearch: vi.fn(),
    onSortChange: vi.fn(),
    onOrderChange: vi.fn(),
    onFavoritesToggle: vi.fn(),
  };

  describe("Initial Rendering", () => {
    it("should render all form controls", () => {
      render(<DashboardSearch {...defaultProps} />);

      expect(screen.getByLabelText("Search")).toBeInTheDocument();
      expect(screen.getByLabelText("Sort by")).toBeInTheDocument();
      expect(screen.getByLabelText("Order")).toBeInTheDocument();
      expect(screen.getByLabelText("Favorites only")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <DashboardSearch {...defaultProps} className="custom-search" />
      );

      const searchDiv = container.querySelector(".dashboard-search.custom-search");
      expect(searchDiv).toBeInTheDocument();
    });

    it("should have proper styling for container", () => {
      const { container } = render(<DashboardSearch {...defaultProps} />);

      const searchDiv = container.querySelector(".dashboard-search");
      expect(searchDiv).toHaveStyle({
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        alignItems: "center",
        padding: "16px",
        background: "#f5f5f5",
        borderRadius: "8px",
        marginBottom: "16px",
      });
    });
  });

  describe("Initial Values", () => {
    it("should use default initial values when not provided", () => {
      render(<DashboardSearch {...defaultProps} />);

      const searchInput = screen.getByLabelText("Search") as HTMLInputElement;
      const sortSelect = screen.getByLabelText("Sort by") as HTMLSelectElement;
      const orderSelect = screen.getByLabelText("Order") as HTMLSelectElement;
      const favoritesCheckbox = screen.getByLabelText("Favorites only") as HTMLInputElement;

      expect(searchInput.value).toBe("");
      expect(sortSelect.value).toBe("created");
      expect(orderSelect.value).toBe("desc");
      expect(favoritesCheckbox.checked).toBe(false);
    });

    it("should use provided initial values", () => {
      render(
        <DashboardSearch
          {...defaultProps}
          initialSearch="expenses"
          initialSort="name"
          initialOrder="asc"
          initialFavorites={true}
        />
      );

      const searchInput = screen.getByLabelText("Search") as HTMLInputElement;
      const sortSelect = screen.getByLabelText("Sort by") as HTMLSelectElement;
      const orderSelect = screen.getByLabelText("Order") as HTMLSelectElement;
      const favoritesCheckbox = screen.getByLabelText("Favorites only") as HTMLInputElement;

      expect(searchInput.value).toBe("expenses");
      expect(sortSelect.value).toBe("name");
      expect(orderSelect.value).toBe("asc");
      expect(favoritesCheckbox.checked).toBe(true);
    });
  });

  describe("Search Input", () => {
    it("should update search input value when typing", () => {
      render(<DashboardSearch {...defaultProps} />);

      const searchInput = screen.getByLabelText("Search") as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: "sales" } });

      expect(searchInput.value).toBe("sales");
    });

    it("should debounce search callback (default 300ms)", async () => {
      render(<DashboardSearch {...defaultProps} />);

      const searchInput = screen.getByLabelText("Search");

      act(() => {
        fireEvent.change(searchInput, { target: { value: "test" } });
      });

      // Should not call immediately
      expect(defaultProps.onSearch).not.toHaveBeenCalled();

      // Fast-forward 300ms
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(defaultProps.onSearch).toHaveBeenCalledWith("test");
    });

    it("should use custom debounce delay", async () => {
      render(<DashboardSearch {...defaultProps} debounceMs={500} />);

      const searchInput = screen.getByLabelText("Search");

      act(() => {
        fireEvent.change(searchInput, { target: { value: "custom" } });
      });

      // Should not call after 300ms
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(defaultProps.onSearch).not.toHaveBeenCalled();

      // Should call after 500ms
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(defaultProps.onSearch).toHaveBeenCalledWith("custom");
    });

    it("should cancel previous debounce when typing again", async () => {
      const onSearch = vi.fn();
      render(<DashboardSearch {...defaultProps} onSearch={onSearch} />);

      const searchInput = screen.getByLabelText("Search");

      // Type first query
      act(() => {
        fireEvent.change(searchInput, { target: { value: "first" } });
      });

      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      // Type second query before debounce completes
      act(() => {
        fireEvent.change(searchInput, { target: { value: "second" } });
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith("second");
      expect(onSearch).not.toHaveBeenCalledWith("first");
    });

    it("should have placeholder text", () => {
      render(<DashboardSearch {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search by title or description...");
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe("Sort Field Selection", () => {
    it("should have all sort options", () => {
      render(<DashboardSearch {...defaultProps} />);

      const sortSelect = screen.getByLabelText("Sort by");
      const options = Array.from(sortSelect.querySelectorAll("option"));

      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent("Name");
      expect(options[1]).toHaveTextContent("Created");
      expect(options[2]).toHaveTextContent("Updated");
    });

    it("should call onSortChange when sort is changed", () => {
      render(<DashboardSearch {...defaultProps} />);

      const sortSelect = screen.getByLabelText("Sort by");
      fireEvent.change(sortSelect, { target: { value: "name" } });

      expect(defaultProps.onSortChange).toHaveBeenCalledWith("name");
    });

    it("should update sort state when changed", () => {
      render(<DashboardSearch {...defaultProps} />);

      const sortSelect = screen.getByLabelText("Sort by") as HTMLSelectElement;
      fireEvent.change(sortSelect, { target: { value: "updated" } });

      expect(sortSelect.value).toBe("updated");
    });
  });

  describe("Sort Order Selection", () => {
    it("should have ascending and descending options", () => {
      render(<DashboardSearch {...defaultProps} />);

      const orderSelect = screen.getByLabelText("Order");
      const options = Array.from(orderSelect.querySelectorAll("option"));

      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent("Ascending");
      expect(options[1]).toHaveTextContent("Descending");
    });

    it("should call onOrderChange when order is changed", () => {
      render(<DashboardSearch {...defaultProps} />);

      const orderSelect = screen.getByLabelText("Order");
      fireEvent.change(orderSelect, { target: { value: "asc" } });

      expect(defaultProps.onOrderChange).toHaveBeenCalledWith("asc");
    });

    it("should update order state when changed", () => {
      render(<DashboardSearch {...defaultProps} />);

      const orderSelect = screen.getByLabelText("Order") as HTMLSelectElement;
      fireEvent.change(orderSelect, { target: { value: "asc" } });

      expect(orderSelect.value).toBe("asc");
    });
  });

  describe("Favorites Filter", () => {
    it("should render favorites checkbox with label", () => {
      render(<DashboardSearch {...defaultProps} />);

      const checkbox = screen.getByLabelText("Favorites only");
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute("type", "checkbox");
    });

    it("should call onFavoritesToggle when checkbox is toggled", () => {
      render(<DashboardSearch {...defaultProps} />);

      const checkbox = screen.getByLabelText("Favorites only");
      fireEvent.click(checkbox);

      expect(defaultProps.onFavoritesToggle).toHaveBeenCalledWith(true);
    });

    it("should toggle checkbox state", () => {
      render(<DashboardSearch {...defaultProps} />);

      const checkbox = screen.getByLabelText("Favorites only") as HTMLInputElement;

      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it("should call onFavoritesToggle with false when unchecked", () => {
      render(<DashboardSearch {...defaultProps} initialFavorites={true} />);

      const checkbox = screen.getByLabelText("Favorites only");
      fireEvent.click(checkbox);

      expect(defaultProps.onFavoritesToggle).toHaveBeenCalledWith(false);
    });
  });

  describe("Accessibility", () => {
    it("should have proper label associations", () => {
      render(<DashboardSearch {...defaultProps} />);

      const searchInput = screen.getByLabelText("Search");
      const sortSelect = screen.getByLabelText("Sort by");
      const orderSelect = screen.getByLabelText("Order");
      const favoritesCheckbox = screen.getByLabelText("Favorites only");

      expect(searchInput).toHaveAttribute("id", "dashboard-search");
      expect(sortSelect).toHaveAttribute("id", "dashboard-sort");
      expect(orderSelect).toHaveAttribute("id", "dashboard-order");
      expect(favoritesCheckbox).toHaveAttribute("id", "dashboard-favorites");
    });

    it("should have appropriate input types", () => {
      render(<DashboardSearch {...defaultProps} />);

      const searchInput = screen.getByLabelText("Search");
      const favoritesCheckbox = screen.getByLabelText("Favorites only");

      expect(searchInput).toHaveAttribute("type", "text");
      expect(favoritesCheckbox).toHaveAttribute("type", "checkbox");
    });
  });

  describe("Layout and Styling", () => {
    it("should have flex layout for search input", () => {
      const { container } = render(<DashboardSearch {...defaultProps} />);

      const searchWrapper = container.querySelector('div[style*="flex: 1 1 300px"]');
      expect(searchWrapper).toBeInTheDocument();
    });

    it("should have fixed width for sort and order selects", () => {
      const { container } = render(<DashboardSearch {...defaultProps} />);

      const sortWrapper = container.querySelector('div[style*="flex: 0 1 150px"]');
      const orderWrapper = container.querySelector('div[style*="flex: 0 1 120px"]');

      expect(sortWrapper).toBeInTheDocument();
      expect(orderWrapper).toBeInTheDocument();
    });

    it("should apply consistent styling to all inputs", () => {
      render(<DashboardSearch {...defaultProps} />);

      const searchInput = screen.getByLabelText("Search");
      const sortSelect = screen.getByLabelText("Sort by");
      const orderSelect = screen.getByLabelText("Order");

      // All should have consistent border and border-radius
      [searchInput, sortSelect, orderSelect].forEach((element) => {
        expect(element).toHaveStyle({
          border: "1px solid #ddd",
          borderRadius: "4px",
          fontSize: "14px",
        });
      });
    });
  });

  describe("Integration", () => {
    it("should handle multiple simultaneous changes", async () => {
      const handlers = {
        onSearch: vi.fn(),
        onSortChange: vi.fn(),
        onOrderChange: vi.fn(),
        onFavoritesToggle: vi.fn(),
      };

      render(<DashboardSearch {...handlers} />);

      // Change all controls
      act(() => {
        fireEvent.change(screen.getByLabelText("Search"), { target: { value: "test" } });
        fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "name" } });
        fireEvent.change(screen.getByLabelText("Order"), { target: { value: "asc" } });
        fireEvent.click(screen.getByLabelText("Favorites only"));
      });

      // Advance timers for debounced search
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(handlers.onSearch).toHaveBeenCalledWith("test");
      expect(handlers.onSortChange).toHaveBeenCalledWith("name");
      expect(handlers.onOrderChange).toHaveBeenCalledWith("asc");
      expect(handlers.onFavoritesToggle).toHaveBeenCalledWith(true);
    });
  });
});
