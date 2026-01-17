import { randomUUID } from "crypto";
import type {
  Artifact,
  ArtifactStore,
  CreateArtifactInput,
  UpdateArtifactInput,
  ListArtifactsQuery,
  ListArtifactsResponse,
  ArtifactVersion,
  CreateVersionInput,
  VersionDiff,
  VersionChange,
} from "../types";
import { applyQuery } from "./queryHelpers";

/**
 * In-memory implementation of ArtifactStore
 * For testing and development purposes
 */
export class InMemoryArtifactStore implements ArtifactStore {
  private artifacts: Map<string, Artifact> = new Map();
  private versions: Map<string, ArtifactVersion[]> = new Map(); // key: artifactId

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

    // Create initial version
    const initialVersion: ArtifactVersion = {
      version: 1,
      schema: input.schema,
      message: "Initial version",
      createdAt: now,
      authorId: userId,
    };
    this.versions.set(artifact.id, [initialVersion]);

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
    this.versions.delete(id);
  }

  async listVersions(artifactId: string): Promise<ArtifactVersion[]> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) {
      throw new Error("Artifact not found");
    }

    const versions = this.versions.get(artifactId) || [];
    return [...versions].sort((a, b) => b.version - a.version); // Newest first
  }

  async getVersion(artifactId: string, version: number): Promise<ArtifactVersion | null> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) {
      throw new Error("Artifact not found");
    }

    const versions = this.versions.get(artifactId) || [];
    return versions.find((v) => v.version === version) || null;
  }

  async createVersion(
    artifactId: string,
    input: CreateVersionInput,
    userId: string
  ): Promise<ArtifactVersion> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) {
      throw new Error("Artifact not found");
    }

    const versions = this.versions.get(artifactId) || [];
    const newVersionNumber = Math.max(...versions.map((v) => v.version), 0) + 1;

    const newVersion: ArtifactVersion = {
      version: newVersionNumber,
      schema: input.schema,
      message: input.message,
      createdAt: new Date(),
      authorId: userId,
    };

    this.versions.set(artifactId, [...versions, newVersion]);

    // Update artifact current version and schema
    const updated: Artifact = {
      ...artifact,
      schema: input.schema,
      version: newVersionNumber,
      updatedAt: new Date(),
    };
    this.artifacts.set(artifactId, updated);

    return newVersion;
  }

  async deleteVersion(artifactId: string, version: number): Promise<void> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) {
      throw new Error("Artifact not found");
    }

    const versions = this.versions.get(artifactId) || [];

    if (version === artifact.version) {
      throw new Error("Cannot delete current version");
    }

    const filtered = versions.filter((v) => v.version !== version);

    if (filtered.length === versions.length) {
      throw new Error("Version not found");
    }

    this.versions.set(artifactId, filtered);
  }

  async getDiff(artifactId: string, fromVersion: number, toVersion: number): Promise<VersionDiff> {
    const from = await this.getVersion(artifactId, fromVersion);
    const to = await this.getVersion(artifactId, toVersion);

    if (!from || !to) {
      throw new Error("Version not found");
    }

    const changes = this.computeDiff(from.schema, to.schema);

    return {
      fromVersion,
      toVersion,
      changes,
    };
  }

  async restoreVersion(artifactId: string, version: number): Promise<Artifact> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) {
      throw new Error("Artifact not found");
    }

    const targetVersion = await this.getVersion(artifactId, version);
    if (!targetVersion) {
      throw new Error("Version not found");
    }

    // Create new version with restored schema
    await this.createVersion(
      artifactId,
      {
        schema: targetVersion.schema,
        message: `Restored from version ${version}`,
      },
      artifact.userId
    );

    // Return updated artifact
    return this.artifacts.get(artifactId)!;
  }

  /**
   * Compute diff between two schemas (simplified)
   */
  private computeDiff(oldSchema: any, newSchema: any, path = ""): VersionChange[] {
    const changes: VersionChange[] = [];

    // Simple object comparison
    const oldKeys = new Set(Object.keys(oldSchema));
    const newKeys = new Set(Object.keys(newSchema));

    // Removed keys
    for (const key of oldKeys) {
      if (!newKeys.has(key)) {
        changes.push({
          type: "remove",
          path: path ? `${path}.${key}` : key,
          oldValue: oldSchema[key],
          description: `Removed ${key}`,
        });
      }
    }

    // Added keys
    for (const key of newKeys) {
      if (!oldKeys.has(key)) {
        changes.push({
          type: "add",
          path: path ? `${path}.${key}` : key,
          newValue: newSchema[key],
          description: `Added ${key}`,
        });
      }
    }

    // Modified keys
    for (const key of oldKeys) {
      if (newKeys.has(key)) {
        const oldValue = oldSchema[key];
        const newValue = newSchema[key];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            type: "modify",
            path: path ? `${path}.${key}` : key,
            oldValue,
            newValue,
            description: `Modified ${key}`,
          });
        }
      }
    }

    return changes;
  }
}
