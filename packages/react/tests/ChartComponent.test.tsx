import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import {
  renderChartComponent,
  expectChartRendered,
  expectChartHasSvg,
  createChartData,
  expectLoadingState,
  expectNoDataState,
} from "./testHelpersChart";

describe("ChartComponent - Real Implementation", () => {
  it("should render bar chart with recharts", () => {
    const data = createChartData("bar", 3);

    renderChartComponent({
      variant: "bar",
      title: "Sales",
      data,
      index: 0,
    });

    expectChartRendered(0);
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expectChartHasSvg(0);
  });

  it("should render line chart", () => {
    const data = createChartData("line", 2);

    renderChartComponent({
      variant: "line",
      data,
      index: 1,
    });

    expectChartRendered(1);
    expectChartHasSvg(1);
  });

  it("should render pie chart", () => {
    const data = createChartData("pie", 3);

    renderChartComponent({
      variant: "pie",
      data,
      index: 2,
    });

    expectChartRendered(2);
    expectChartHasSvg(2);
  });

  it("should handle empty data gracefully", () => {
    renderChartComponent({
      variant: "bar",
      data: [],
      index: 0,
    });

    expectChartRendered(0);
    expectNoDataState();
  });

  it("should show loading state", () => {
    renderChartComponent({
      variant: "bar",
      loading: true,
      index: 0,
    });

    expectLoadingState();
  });

  it("should apply custom dimensions", () => {
    const data = [{ x: 1, y: 2 }];

    const { container } = renderChartComponent({
      variant: "bar",
      data,
      width: 800,
      height: 400,
      index: 0,
    });

    const chartElement = container.querySelector('[data-testid="liquid-component-chart-0"]');
    expect(chartElement).toBeInTheDocument();
  });

  it("should handle unsupported chart variant", () => {
    const data = [{ x: 1, y: 2 }];

    renderChartComponent({
      variant: "scatter" as any,
      data,
      index: 0,
    });

    expect(screen.getByText(/unsupported chart variant/i)).toBeInTheDocument();
  });
});
