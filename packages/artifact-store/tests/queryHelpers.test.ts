import { describe, it, expect } from "vitest";
import type { Artifact } from "../src/types";
import {
  filterByUserId,
  filterByTags,
  filterByVisibility,
  filterBySearch,
  sortArtifacts,
  paginateArtifacts,
  applyQuery,
} from "../src/stores/queryHelpers";

describe("Query Helpers", () => {
  const mockArtifacts: Artifact[] = [
    {
      id: "1",
      userId: "user1",
      title: "First Artifact",
      description: "Description of first",
      schema: {
        version: "1.0",
        layout: { type: "grid", columns: 1 },
        components: [],
        data_sources: {},
      },
      version: 1,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      tags: ["tag1", "tag2"],
      visibility: "public",
    },
    {
      id: "2",
      userId: "user2",
      title: "Second Artifact",
      description: "Description of second",
      schema: {
        version: "1.0",
        layout: { type: "grid", columns: 1 },
        components: [],
        data_sources: {},
      },
      version: 1,
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
      tags: ["tag2", "tag3"],
      visibility: "private",
    },
    {
      id: "3",
      userId: "user1",
      title: "Third Artifact",
      description: undefined,
      schema: {
        version: "1.0",
        layout: { type: "grid", columns: 1 },
        components: [],
        data_sources: {},
      },
      version: 1,
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date("2024-01-03"),
      tags: ["tag1"],
      visibility: "public",
    },
  ];

  describe("filterByUserId", () => {
    it("should filter artifacts by userId", () => {
      const result = filterByUserId(mockArtifacts, "user1");
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe("user1");
      expect(result[1].userId).toBe("user1");
    });

    it("should return all artifacts when userId is undefined", () => {
      const result = filterByUserId(mockArtifacts, undefined);
      expect(result).toHaveLength(3);
    });
  });

  describe("filterByTags", () => {
    it("should filter artifacts by tags (AND logic)", () => {
      const result = filterByTags(mockArtifacts, ["tag1", "tag2"]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should return all artifacts when tags is undefined", () => {
      const result = filterByTags(mockArtifacts, undefined);
      expect(result).toHaveLength(3);
    });

    it("should return all artifacts when tags is empty array", () => {
      const result = filterByTags(mockArtifacts, []);
      expect(result).toHaveLength(3);
    });
  });

  describe("filterByVisibility", () => {
    it("should filter artifacts by visibility (public)", () => {
      const result = filterByVisibility(mockArtifacts, "public");
      expect(result).toHaveLength(2);
      expect(result[0].visibility).toBe("public");
      expect(result[1].visibility).toBe("public");
    });

    it("should filter artifacts by visibility (private)", () => {
      const result = filterByVisibility(mockArtifacts, "private");
      expect(result).toHaveLength(1);
      expect(result[0].visibility).toBe("private");
    });

    it("should return all artifacts when visibility is undefined", () => {
      const result = filterByVisibility(mockArtifacts, undefined);
      expect(result).toHaveLength(3);
    });
  });

  describe("filterBySearch", () => {
    it("should filter artifacts by title search", () => {
      const result = filterBySearch(mockArtifacts, "first");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("First Artifact");
    });

    it("should filter artifacts by description search", () => {
      const result = filterBySearch(mockArtifacts, "second");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Second Artifact");
    });

    it("should handle artifacts with undefined description", () => {
      const result = filterBySearch(mockArtifacts, "third");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Third Artifact");
    });

    it("should return all artifacts when search is undefined", () => {
      const result = filterBySearch(mockArtifacts, undefined);
      expect(result).toHaveLength(3);
    });

    it("should be case-insensitive", () => {
      const result = filterBySearch(mockArtifacts, "FIRST");
      expect(result).toHaveLength(1);
    });
  });

  describe("sortArtifacts", () => {
    it("should sort by createdAt descending (default)", () => {
      const result = sortArtifacts([...mockArtifacts]);
      expect(result[0].id).toBe("3"); // 2024-01-03
      expect(result[1].id).toBe("2"); // 2024-01-02
      expect(result[2].id).toBe("1"); // 2024-01-01
    });

    it("should sort by createdAt ascending", () => {
      const result = sortArtifacts([...mockArtifacts], "createdAt", "asc");
      expect(result[0].id).toBe("1"); // 2024-01-01
      expect(result[1].id).toBe("2"); // 2024-01-02
      expect(result[2].id).toBe("3"); // 2024-01-03
    });

    it("should sort by title descending", () => {
      const result = sortArtifacts([...mockArtifacts], "title", "desc");
      expect(result[0].title).toBe("Third Artifact");
      expect(result[1].title).toBe("Second Artifact");
      expect(result[2].title).toBe("First Artifact");
    });

    it("should sort by title ascending", () => {
      const result = sortArtifacts([...mockArtifacts], "title", "asc");
      expect(result[0].title).toBe("First Artifact");
      expect(result[1].title).toBe("Second Artifact");
      expect(result[2].title).toBe("Third Artifact");
    });

    it("should sort by updatedAt", () => {
      const result = sortArtifacts([...mockArtifacts], "updatedAt", "desc");
      expect(result[0].id).toBe("3");
      expect(result[1].id).toBe("2");
      expect(result[2].id).toBe("1");
    });
  });

  describe("paginateArtifacts", () => {
    it("should paginate artifacts with default offset and limit", () => {
      const result = paginateArtifacts(mockArtifacts);
      expect(result).toHaveLength(3); // All fit in default limit of 20
    });

    it("should paginate artifacts with custom offset and limit", () => {
      const result = paginateArtifacts(mockArtifacts, 1, 2);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("2");
      expect(result[1].id).toBe("3");
    });

    it("should handle offset beyond array length", () => {
      const result = paginateArtifacts(mockArtifacts, 10, 5);
      expect(result).toHaveLength(0);
    });

    it("should handle limit larger than remaining items", () => {
      const result = paginateArtifacts(mockArtifacts, 2, 10);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("3");
    });
  });

  describe("applyQuery", () => {
    it("should apply all query operations in correct order", () => {
      const result = applyQuery(mockArtifacts, {
        userId: "user1",
        tags: ["tag1"],
        visibility: "public",
        sortBy: "createdAt",
        sortOrder: "asc",
        offset: 0,
        limit: 10,
      });

      expect(result.artifacts).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(10);
      expect(result.artifacts[0].id).toBe("1");
      expect(result.artifacts[1].id).toBe("3");
    });

    it("should handle empty query", () => {
      const result = applyQuery(mockArtifacts, {});
      expect(result.artifacts).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it("should apply pagination after filtering", () => {
      const result = applyQuery(mockArtifacts, {
        visibility: "public",
        offset: 1,
        limit: 1,
      });

      expect(result.total).toBe(2); // Total after filtering
      expect(result.artifacts).toHaveLength(1); // Paginated result
    });
  });
});
