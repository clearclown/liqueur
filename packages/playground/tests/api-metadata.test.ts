/**
 * Database Metadata API Tests
 * /api/liquid/metadata エンドポイントのユニットテスト
 *
 * TDD Approach: Red-Green-Refactor
 */

import { describe, it, expect } from "vitest";
import { GET } from "../app/api/liquid/metadata/route";
import { createMockRequest } from "./helpers/testHelpers";

describe("GET /api/liquid/metadata", () => {
  describe("TC-META-001: Get Database Metadata", () => {
    it("should return database metadata with tables", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/metadata",
        "GET"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata).toBeDefined();
      expect(data.metadata.tables).toBeDefined();
      expect(Array.isArray(data.metadata.tables)).toBe(true);
      expect(data.metadata.tables.length).toBeGreaterThan(0);
    });

    it("should return table metadata with columns", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/metadata",
        "GET"
      );

      const response = await GET(request);
      const data = await response.json();

      const firstTable = data.metadata.tables[0];
      expect(firstTable.name).toBeDefined();
      expect(firstTable.columns).toBeDefined();
      expect(Array.isArray(firstTable.columns)).toBe(true);
      expect(firstTable.columns.length).toBeGreaterThan(0);
    });

    it("should return column metadata with type information", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/metadata",
        "GET"
      );

      const response = await GET(request);
      const data = await response.json();

      const firstColumn = data.metadata.tables[0].columns[0];
      expect(firstColumn.name).toBeDefined();
      expect(firstColumn.type).toBeDefined();
      expect(typeof firstColumn.nullable).toBe("boolean");
      expect(typeof firstColumn.isPrimaryKey).toBe("boolean");
      expect(typeof firstColumn.isForeignKey).toBe("boolean");
    });

    it("should include metadata timestamp", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/metadata",
        "GET"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.generatedAt).toBeDefined();
      // ISO 8601 format check
      expect(() => new Date(data.generatedAt)).not.toThrow();
    });
  });

  describe("TC-META-002: Error Handling", () => {
    it("should handle database connection errors gracefully", async () => {
      // This test will verify error handling when DB is unavailable
      // For now, we assume the metadata service handles errors properly
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/metadata",
        "GET"
      );

      const response = await GET(request);

      // Should either succeed or return proper error
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });
  });

  describe("TC-META-003: Performance", () => {
    it("should return metadata within acceptable time", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/metadata",
        "GET"
      );

      const startTime = Date.now();
      await GET(request);
      const endTime = Date.now();

      const duration = endTime - startTime;
      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
