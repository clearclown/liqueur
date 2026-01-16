/**
 * Artifact CRUD API Tests
 * /api/liquid/artifacts/* エンドポイントのユニットテスト
 *
 * TDD Approach: Red-Green-Refactor
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "../app/api/liquid/artifacts/route";
import { GET as GetById, PUT, DELETE } from "../app/api/liquid/artifacts/[id]/route";
import { createMockRequest } from "./helpers/testHelpers";
import { mockSchema } from "./fixtures/mockSchemas";

describe("POST /api/liquid/artifacts", () => {
  describe("TC-ART-001: Create Artifact", () => {
    it("should create new artifact with valid schema", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts",
        "POST",
        {
          name: "Monthly Dashboard",
          schema: mockSchema,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.artifact).toBeDefined();
      expect(data.artifact.id).toBeDefined();
      expect(data.artifact.name).toBe("Monthly Dashboard");
      expect(data.artifact.schema).toEqual(mockSchema);
      expect(data.artifact.createdAt).toBeDefined();
      expect(data.artifact.updatedAt).toBeDefined();
    });

    it("should reject request without name", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts",
        "POST",
        {
          schema: mockSchema,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("MISSING_NAME");
    });

    it("should reject request without schema", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts",
        "POST",
        {
          name: "Test Dashboard",
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("MISSING_SCHEMA");
    });

    it("should reject empty name", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts",
        "POST",
        {
          name: "   ",
          schema: mockSchema,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("EMPTY_NAME");
    });

    it("should reject invalid schema", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts",
        "POST",
        {
          name: "Test Dashboard",
          schema: { invalid: "schema" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("INVALID_SCHEMA");
    });
  });
});

describe("GET /api/liquid/artifacts", () => {
  describe("TC-ART-002: List Artifacts", () => {
    it("should return list of artifacts", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts",
        "GET"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.artifacts).toBeDefined();
      expect(Array.isArray(data.artifacts)).toBe(true);
    });

    it("should return artifacts with metadata", async () => {
      // まず1つ作成
      const createRequest = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts",
        "POST",
        {
          name: "Test Dashboard",
          schema: mockSchema,
        }
      );
      await POST(createRequest);

      // リスト取得
      const listRequest = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts",
        "GET"
      );
      const response = await GET(listRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.artifacts.length).toBeGreaterThan(0);

      const artifact = data.artifacts[0];
      expect(artifact.id).toBeDefined();
      expect(artifact.name).toBeDefined();
      expect(artifact.createdAt).toBeDefined();
      expect(artifact.updatedAt).toBeDefined();
    });
  });
});

describe("GET /api/liquid/artifacts/:id", () => {
  describe("TC-ART-003: Get Single Artifact", () => {
    it("should return artifact by id", async () => {
      // まず作成
      const createRequest = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts",
        "POST",
        {
          name: "Test Dashboard",
          schema: mockSchema,
        }
      );
      const createResponse = await POST(createRequest);
      const createData = await createResponse.json();
      const artifactId = createData.artifact.id;

      // ID指定で取得
      const getRequest = createMockRequest(
        `http://localhost:3000/api/liquid/artifacts/${artifactId}`,
        "GET"
      );
      const response = await GetById(getRequest, { params: { id: artifactId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.artifact).toBeDefined();
      expect(data.artifact.id).toBe(artifactId);
      expect(data.artifact.name).toBe("Test Dashboard");
      expect(data.artifact.schema).toEqual(mockSchema);
    });

    it("should return 404 for non-existent id", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts/nonexistent",
        "GET"
      );

      const response = await GetById(request, { params: { id: "nonexistent" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("ARTIFACT_NOT_FOUND");
    });
  });
});

describe("PUT /api/liquid/artifacts/:id", () => {
  describe("TC-ART-004: Update Artifact", () => {
    it("should update artifact name", async () => {
      // まず作成
      const createRequest = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts",
        "POST",
        {
          name: "Original Name",
          schema: mockSchema,
        }
      );
      const createResponse = await POST(createRequest);
      const createData = await createResponse.json();
      const artifactId = createData.artifact.id;

      // タイムスタンプが異なることを保証するため、わずかに遅延
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 更新
      const updateRequest = createMockRequest(
        `http://localhost:3000/api/liquid/artifacts/${artifactId}`,
        "PUT",
        {
          name: "Updated Name",
        }
      );
      const response = await PUT(updateRequest, { params: { id: artifactId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.artifact.name).toBe("Updated Name");
      expect(data.artifact.updatedAt).not.toBe(createData.artifact.updatedAt);
    });

    it("should update artifact schema", async () => {
      // まず作成
      const createRequest = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts",
        "POST",
        {
          name: "Test Dashboard",
          schema: mockSchema,
        }
      );
      const createResponse = await POST(createRequest);
      const createData = await createResponse.json();
      const artifactId = createData.artifact.id;

      // 新しいスキーマ
      const newSchema: LiquidViewSchema = {
        ...mockSchema,
        layout: { type: "stack", direction: "vertical", gap: 8 },
      };

      // 更新
      const updateRequest = createMockRequest(
        `http://localhost:3000/api/liquid/artifacts/${artifactId}`,
        "PUT",
        {
          schema: newSchema,
        }
      );
      const response = await PUT(updateRequest, { params: { id: artifactId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.artifact.schema.layout.type).toBe("stack");
    });

    it("should return 404 for non-existent id", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts/nonexistent",
        "PUT",
        {
          name: "Updated Name",
        }
      );

      const response = await PUT(request, { params: { id: "nonexistent" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("ARTIFACT_NOT_FOUND");
    });
  });
});

describe("DELETE /api/liquid/artifacts/:id", () => {
  describe("TC-ART-005: Delete Artifact", () => {
    it("should delete artifact by id", async () => {
      // まず作成
      const createRequest = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts",
        "POST",
        {
          name: "To Be Deleted",
          schema: mockSchema,
        }
      );
      const createResponse = await POST(createRequest);
      const createData = await createResponse.json();
      const artifactId = createData.artifact.id;

      // 削除
      const deleteRequest = createMockRequest(
        `http://localhost:3000/api/liquid/artifacts/${artifactId}`,
        "DELETE"
      );
      const response = await DELETE(deleteRequest, { params: { id: artifactId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // 削除後に取得を試みる
      const getRequest = createMockRequest(
        `http://localhost:3000/api/liquid/artifacts/${artifactId}`,
        "GET"
      );
      const getResponse = await GetById(getRequest, { params: { id: artifactId } });
      expect(getResponse.status).toBe(404);
    });

    it("should return 404 for non-existent id", async () => {
      const request = createMockRequest(
        "http://localhost:3000/api/liquid/artifacts/nonexistent",
        "DELETE"
      );

      const response = await DELETE(request, { params: { id: "nonexistent" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("ARTIFACT_NOT_FOUND");
    });
  });
});
