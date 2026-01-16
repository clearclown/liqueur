import { describe, it, expect } from "vitest";
import {
  LiquidRenderer,
  ChartComponent,
  TableComponent,
  GridLayout,
  StackLayout,
} from "../src/index";

describe("Package Exports", () => {
  it("should export LiquidRenderer", () => {
    expect(LiquidRenderer).toBeDefined();
    expect(typeof LiquidRenderer).toBe("function");
  });

  it("should export ChartComponent", () => {
    expect(ChartComponent).toBeDefined();
    expect(typeof ChartComponent).toBe("function");
  });

  it("should export TableComponent", () => {
    expect(TableComponent).toBeDefined();
    expect(typeof TableComponent).toBe("function");
  });

  it("should export GridLayout", () => {
    expect(GridLayout).toBeDefined();
    expect(typeof GridLayout).toBe("function");
  });

  it("should export StackLayout", () => {
    expect(StackLayout).toBeDefined();
    expect(typeof StackLayout).toBe("function");
  });
});
