/**
 * ArtifactGenerator Tests
 * AI JSON生成サービスのテスト
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ArtifactGenerator } from "../src/services/ArtifactGenerator";
import { MockProvider } from "../src/providers/MockProvider";
import type { DatabaseMetadata } from "../src/types";

describe("ArtifactGenerator", () => {
  let generator: ArtifactGenerator;
  let mockProvider: MockProvider;

  const defaultMetadata: DatabaseMetadata = {
    tables: [
      {
        name: "sales",
        description: "Sales data",
        columns: [
          { name: "id", type: "integer", nullable: false, isPrimaryKey: true, isForeignKey: false },
          { name: "amount", type: "decimal", nullable: false, isPrimaryKey: false, isForeignKey: false },
        ],
      },
    ],
  };

  beforeEach(() => {
    mockProvider = new MockProvider();
    generator = new ArtifactGenerator(mockProvider);
  });

  describe("generateArtifact", () => {
    it("should generate valid LiquidViewSchema from simple request", async () => {
      const result = await generator.generateArtifact({
        userRequest: "Show me sales data",
        metadata: defaultMetadata,
      });

      expect(result.schema).toBeDefined();
      expect(result.schema.version).toBe("1.0");
      expect(result.schema.layout).toBeDefined();
      expect(result.schema.components).toBeInstanceOf(Array);
      expect(result.schema.data_sources).toBeDefined();
    });

    it("should generate schema with components", async () => {
      const result = await generator.generateArtifact({
        userRequest: "Show me monthly sales",
        metadata: defaultMetadata,
      });

      expect(result.schema.components.length).toBeGreaterThan(0);
    });

    it("should include data_sources in schema", async () => {
      const result = await generator.generateArtifact({
        userRequest: "Show me sales data",
        metadata: defaultMetadata,
      });

      expect(Object.keys(result.schema.data_sources).length).toBeGreaterThan(0);
    });

    it("should return prompt and rawResponse", async () => {
      const result = await generator.generateArtifact({
        userRequest: "Show me sales data",
        metadata: defaultMetadata,
      });

      expect(result.prompt).toBeTruthy();
      expect(result.rawResponse).toBeTruthy();
    });

    it("should estimate cost", async () => {
      const result = await generator.generateArtifact({
        userRequest: "Show me sales data",
        metadata: defaultMetadata,
      });

      expect(result.estimatedCost).toBeGreaterThan(0);
    });
  });

  describe("generateArtifact with metadata", () => {
    const metadata: DatabaseMetadata = {
      tables: [
        {
          name: "sales",
          description: "Sales transactions",
          columns: [
            { name: "id", type: "integer", nullable: false, isPrimaryKey: true, isForeignKey: false },
            { name: "amount", type: "decimal", nullable: false, isPrimaryKey: false, isForeignKey: false },
            { name: "date", type: "date", nullable: false, isPrimaryKey: false, isForeignKey: false },
            { name: "customer_id", type: "integer", nullable: false, isPrimaryKey: false, isForeignKey: true },
          ],
        },
        {
          name: "customers",
          description: "Customer information",
          columns: [
            { name: "id", type: "integer", nullable: false, isPrimaryKey: true, isForeignKey: false },
            { name: "name", type: "text", nullable: false, isPrimaryKey: false, isForeignKey: false },
            { name: "email", type: "text", nullable: false, isPrimaryKey: false, isForeignKey: false },
          ],
        },
      ],
    };

    it("should use metadata to generate appropriate schema", async () => {
      const result = await generator.generateArtifact({
        userRequest: "Show me sales by date",
        metadata,
      });

      // メタデータに基づいたdata_sourceが生成されているか確認
      const dataSources = result.schema.data_sources;
      const dataSourceValues = Object.values(dataSources);

      expect(dataSourceValues.some((ds) => ds.resource === "sales")).toBe(true);
    });

    it("should include database context in prompt", async () => {
      const result = await generator.generateArtifact({
        userRequest: "Show me customer list",
        metadata,
      });

      // プロンプトにメタデータ情報が含まれているか確認
      expect(result.prompt).toContain("sales");
      expect(result.prompt).toContain("customers");
    });
  });

  describe("editArtifact", () => {
    const existingSchema = {
      version: "1.0" as const,
      layout: { type: "grid" as const, columns: 1, gap: 16 },
      components: [
        {
          type: "chart" as const,
          variant: "bar" as const,
          title: "Sales",
          data_source: "ds_sales",
          x_axis: "month",
          y_axis: "amount",
        },
      ],
      data_sources: {
        ds_sales: {
          resource: "sales",
        },
      },
    };

    it("should edit existing schema", async () => {
      const result = await generator.editArtifact(
        existingSchema,
        "Add a table showing top customers",
        defaultMetadata
      );

      expect(result.schema).toBeDefined();
      expect(result.schema.version).toBe("1.0");
    });

    it("should preserve structure when editing", async () => {
      const result = await generator.editArtifact(
        existingSchema,
        "Update the chart",
        defaultMetadata
      );

      expect(result.schema.components.length).toBeGreaterThanOrEqual(1);
    });
  });
});
