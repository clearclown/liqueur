import React from "react";
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import {
  renderGridLayout,
  renderStackLayout,
  expectGridAttributes,
  expectStackAttributes,
} from "./testHelpersLayouts";

describe("Layout Components", () => {
  describe("GridLayout", () => {
    it("should render with specified columns", () => {
      renderGridLayout(
        { columns: 3 },
        <>
          <div>Item 1</div>
          <div>Item 2</div>
        </>
      );

      expectGridAttributes(3);
    });

    it("should apply gap styling", () => {
      renderGridLayout({ columns: 2, gap: 16 }, <div>Item</div>);

      expectGridAttributes(2, 16);
    });

    it("should render with default gap of 0", () => {
      renderGridLayout({ columns: 1 }, <div>Item</div>);

      expectGridAttributes(1, 0);
    });

    it("should render children correctly", () => {
      renderGridLayout(
        { columns: 2 },
        <>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </>
      );

      expect(screen.getByText("Child 1")).toBeInTheDocument();
      expect(screen.getByText("Child 2")).toBeInTheDocument();
      expect(screen.getByText("Child 3")).toBeInTheDocument();
    });
  });

  describe("StackLayout", () => {
    it("should render with vertical direction", () => {
      renderStackLayout(
        { direction: "vertical" },
        <>
          <div>Item 1</div>
          <div>Item 2</div>
        </>
      );

      expectStackAttributes("vertical");
    });

    it("should render with horizontal direction", () => {
      renderStackLayout({ direction: "horizontal" }, <div>Item</div>);

      expectStackAttributes("horizontal");
    });

    it("should render with default vertical direction", () => {
      renderStackLayout({}, <div>Item</div>);

      expectStackAttributes("vertical");
    });

    it("should apply gap styling", () => {
      renderStackLayout({ gap: 8 }, <div>Item</div>);

      expectStackAttributes("vertical", 8);
    });

    it("should render children correctly", () => {
      renderStackLayout(
        {},
        <>
          <div>First</div>
          <div>Second</div>
        </>
      );

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
    });
  });
});
