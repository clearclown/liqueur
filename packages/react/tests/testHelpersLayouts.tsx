/**
 * Test Helper Functions for Layout Component Tests
 * Reduces duplication in layouts.test.tsx
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { GridLayout } from "../src/layouts/GridLayout";
import { StackLayout } from "../src/layouts/StackLayout";

/**
 * Renders GridLayout with the given props and children
 */
export function renderGridLayout(
  props: Partial<React.ComponentProps<typeof GridLayout>>,
  children: React.ReactNode
) {
  return render(
    <GridLayout type="grid" columns={props.columns || 1} {...props}>
      {children}
    </GridLayout>
  );
}

/**
 * Renders StackLayout with the given props and children
 */
export function renderStackLayout(
  props: Partial<React.ComponentProps<typeof StackLayout>>,
  children: React.ReactNode
) {
  return render(
    <StackLayout type="stack" {...props}>
      {children}
    </StackLayout>
  );
}

/**
 * Gets the grid layout element from the DOM
 */
export function getGridLayout() {
  return screen.getByTestId("liquid-grid-layout");
}

/**
 * Gets the stack layout element from the DOM
 */
export function getStackLayout() {
  return screen.getByTestId("liquid-stack-layout");
}

/**
 * Expects grid layout to have specific attributes
 */
export function expectGridAttributes(columns: number, gap?: number) {
  const grid = getGridLayout();
  expect(grid).toHaveAttribute("data-columns", String(columns));

  if (gap !== undefined) {
    expect(grid).toHaveStyle({ gap: `${gap}px` });
  }

  return grid;
}

/**
 * Expects stack layout to have specific attributes
 */
export function expectStackAttributes(
  direction: "vertical" | "horizontal" = "vertical",
  gap?: number
) {
  const stack = getStackLayout();
  expect(stack).toHaveAttribute("data-direction", direction);

  const flexDirection = direction === "vertical" ? "column" : "row";
  expect(stack).toHaveStyle({ flexDirection });

  if (gap !== undefined) {
    expect(stack).toHaveStyle({ gap: `${gap}px` });
  }

  return stack;
}
