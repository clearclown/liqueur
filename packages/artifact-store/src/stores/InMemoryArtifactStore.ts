import { randomUUID } from "crypto";
import type {
  Artifact,
  ArtifactStore,
  CreateArtifactInput,
  UpdateArtifactInput,
  ListArtifactsQuery,
  ListArtifactsResponse,
} from "../types";
import { applyQuery } from "./queryHelpers";

/**
 * In-memory implementation of ArtifactStore
 * For testing and development purposes
 */
export class InMemoryArtifactStore implements ArtifactStore {
  private artifacts: Map<string, Artifact> = new Map();

  async create(input: CreateArtifactInput, userId: string): Promise<Artifact> {
    // Validation
    if (!input.title || input.title.trim() === "") {
      throw new Error("Title cannot be empty");
    }

    const now = new Date();

    const artifact: Artifact = {
      id: randomUUID(),
      userId,
      title: input.title,
      description: input.description,
      schema: input.schema,
      version: 1,
      createdAt: now,
      updatedAt: now,
      tags: input.tags || [],
      visibility: input.visibility || "private",
    };

    this.artifacts.set(artifact.id, artifact);

    return artifact;
  }

  async get(id: string): Promise<Artifact | null> {
    const artifact = this.artifacts.get(id);
    return artifact || null;
  }

  async list(query: ListArtifactsQuery = {}): Promise<ListArtifactsResponse> {
    const artifacts = Array.from(this.artifacts.values());
    return applyQuery(artifacts, query);
  }

  async update(id: string, input: UpdateArtifactInput): Promise<Artifact> {
    const artifact = this.artifacts.get(id);

    if (!artifact) {
      throw new Error("Artifact not found");
    }

    const updated: Artifact = {
      ...artifact,
      title: input.title !== undefined ? input.title : artifact.title,
      description: input.description !== undefined ? input.description : artifact.description,
      schema: input.schema !== undefined ? input.schema : artifact.schema,
      tags: input.tags !== undefined ? input.tags : artifact.tags,
      visibility: input.visibility !== undefined ? input.visibility : artifact.visibility,
      version: artifact.version + 1,
      updatedAt: new Date(),
    };

    this.artifacts.set(id, updated);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const artifact = this.artifacts.get(id);

    if (!artifact) {
      throw new Error("Artifact not found");
    }

    this.artifacts.delete(id);
  }
}
