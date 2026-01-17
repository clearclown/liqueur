/**
 * Version Management API Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { Artifact, ArtifactVersion, CreateVersionInput } from "@liqueur/artifact-store";
import type { LiquidViewSchema } from "@liqueur/protocol";

// Test helpers
const API_BASE = "http://localhost:3000/api/liquid/artifacts";

const testSchema: LiquidViewSchema = {
  version: "1.0",
  layout: {
    type: "grid",
    columns: 2,
    gap: 16,
  },
  components: [],
  data_sources: {},
};

const testSchema2: LiquidViewSchema = {
  version: "1.0",
  layout: {
    type: "stack",
    direction: "vertical",
    gap: 8,
  },
  components: [],
  data_sources: {},
};

describe("Artifact Versions API", () => {
  let createdArtifactId: string;

  beforeEach(async () => {
    // Create a test artifact
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schema: testSchema,
        name: "Test Artifact for Versions",
        description: "Test artifact for version management tests",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    createdArtifactId = data.artifact.id;
  });

  describe("POST /api/liquid/artifacts/:id/versions", () => {
    it("should create a new version", async () => {
      const input: CreateVersionInput = {
        schema: testSchema2,
        message: "Updated layout to stack",
      };

      const response = await fetch(`${API_BASE}/${createdArtifactId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.version).toBeDefined();
      expect(data.version.version).toBe(2);
      expect(data.version.schema).toEqual(testSchema2);
      expect(data.version.message).toBe("Updated layout to stack");
    });

    it("should reject invalid JSON", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe("INVALID_JSON");
    });

    it("should reject missing schema", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "test" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe("MISSING_SCHEMA");
    });

    it("should return 404 for non-existent artifact", async () => {
      const input: CreateVersionInput = {
        schema: testSchema2,
      };

      const response = await fetch(`${API_BASE}/nonexistent/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe("ARTIFACT_NOT_FOUND");
    });
  });

  describe("GET /api/liquid/artifacts/:id/versions", () => {
    beforeEach(async () => {
      // Create a second version
      await fetch(`${API_BASE}/${createdArtifactId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema: testSchema2,
          message: "Second version",
        }),
      });
    });

    it("should list all versions", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/versions`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.versions).toBeDefined();
      expect(Array.isArray(data.versions)).toBe(true);
      expect(data.versions.length).toBeGreaterThanOrEqual(2);
      expect(data.versions[0].version).toBe(1);
      expect(data.versions[1].version).toBe(2);
    });

    it("should return 404 for non-existent artifact", async () => {
      const response = await fetch(`${API_BASE}/nonexistent/versions`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe("ARTIFACT_NOT_FOUND");
    });
  });

  describe("GET /api/liquid/artifacts/:id/versions/:version", () => {
    it("should get specific version", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/versions/1`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.version).toBeDefined();
      expect(data.version.version).toBe(1);
      expect(data.version.schema).toEqual(testSchema);
    });

    it("should reject invalid version number", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/versions/0`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe("INVALID_VERSION");
    });

    it("should return 404 for non-existent version", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/versions/999`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe("VERSION_NOT_FOUND");
    });

    it("should return 404 for non-existent artifact", async () => {
      const response = await fetch(`${API_BASE}/nonexistent/versions/1`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe("ARTIFACT_NOT_FOUND");
    });
  });

  describe("DELETE /api/liquid/artifacts/:id/versions/:version", () => {
    beforeEach(async () => {
      // Create multiple versions
      await fetch(`${API_BASE}/${createdArtifactId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: testSchema2, message: "Version 2" }),
      });
      await fetch(`${API_BASE}/${createdArtifactId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: testSchema, message: "Version 3" }),
      });
    });

    it("should delete old version", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/versions/1`, {
        method: "DELETE",
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify version is deleted
      const getResponse = await fetch(`${API_BASE}/${createdArtifactId}/versions/1`);
      expect(getResponse.status).toBe(404);
    });

    it("should reject deleting current version", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/versions/3`, {
        method: "DELETE",
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe("CANNOT_DELETE_CURRENT");
    });

    it("should reject invalid version number", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/versions/0`, {
        method: "DELETE",
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe("INVALID_VERSION");
    });

    it("should return 404 for non-existent version", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/versions/999`, {
        method: "DELETE",
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe("VERSION_NOT_FOUND");
    });

    it("should return 404 for non-existent artifact", async () => {
      const response = await fetch(`${API_BASE}/nonexistent/versions/1`, {
        method: "DELETE",
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe("ARTIFACT_NOT_FOUND");
    });
  });

  describe("GET /api/liquid/artifacts/:id/diff", () => {
    beforeEach(async () => {
      // Create a second version with different schema
      await fetch(`${API_BASE}/${createdArtifactId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema: testSchema2,
          message: "Changed layout",
        }),
      });
    });

    it("should get diff between versions", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/diff?from=1&to=2`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.diff).toBeDefined();
      expect(data.diff.fromVersion).toBe(1);
      expect(data.diff.toVersion).toBe(2);
      expect(Array.isArray(data.diff.changes)).toBe(true);
      expect(data.diff.changes.length).toBeGreaterThan(0);
    });

    it("should reject missing parameters", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/diff?from=1`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe("MISSING_PARAMETERS");
    });

    it("should reject invalid version numbers", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/diff?from=0&to=1`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe("INVALID_VERSION");
    });

    it("should return 404 for non-existent version", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/diff?from=1&to=999`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe("VERSION_NOT_FOUND");
    });

    it("should return 404 for non-existent artifact", async () => {
      const response = await fetch(`${API_BASE}/nonexistent/diff?from=1&to=2`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe("ARTIFACT_NOT_FOUND");
    });
  });

  describe("POST /api/liquid/artifacts/:id/restore", () => {
    beforeEach(async () => {
      // Create multiple versions
      await fetch(`${API_BASE}/${createdArtifactId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: testSchema2, message: "Version 2" }),
      });
      await fetch(`${API_BASE}/${createdArtifactId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: testSchema, message: "Version 3" }),
      });
    });

    it("should restore to previous version", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: 1 }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.artifact).toBeDefined();
      expect(data.artifact.schema).toEqual(testSchema);

      // Verify artifact was updated
      const getResponse = await fetch(`${API_BASE}/${createdArtifactId}`);
      const getData = await getResponse.json();
      expect(getData.artifact.schema).toEqual(testSchema);
    });

    it("should reject invalid JSON", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe("INVALID_JSON");
    });

    it("should reject missing version", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe("MISSING_VERSION");
    });

    it("should reject invalid version number", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: 0 }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe("INVALID_VERSION");
    });

    it("should return 404 for non-existent version", async () => {
      const response = await fetch(`${API_BASE}/${createdArtifactId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: 999 }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe("VERSION_NOT_FOUND");
    });

    it("should return 404 for non-existent artifact", async () => {
      const response = await fetch(`${API_BASE}/nonexistent/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: 1 }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe("ARTIFACT_NOT_FOUND");
    });
  });
});
