import { randomUUID } from 'crypto';
import type {
  Artifact,
  ArtifactStore,
  CreateArtifactInput,
  UpdateArtifactInput,
  ListArtifactsQuery,
  ListArtifactsResponse,
} from '../types';

/**
 * In-memory implementation of ArtifactStore
 * For testing and development purposes
 */
export class InMemoryArtifactStore implements ArtifactStore {
  private artifacts: Map<string, Artifact> = new Map();

  async create(input: CreateArtifactInput, userId: string): Promise<Artifact> {
    // Validation
    if (!input.title || input.title.trim() === '') {
      throw new Error('Title cannot be empty');
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
      visibility: input.visibility || 'private',
    };

    this.artifacts.set(artifact.id, artifact);

    return artifact;
  }

  async get(id: string): Promise<Artifact | null> {
    const artifact = this.artifacts.get(id);
    return artifact || null;
  }

  async list(query: ListArtifactsQuery = {}): Promise<ListArtifactsResponse> {
    let artifacts = Array.from(this.artifacts.values());

    // Filter by userId
    if (query.userId) {
      artifacts = artifacts.filter((a) => a.userId === query.userId);
    }

    // Filter by tags (AND logic)
    if (query.tags && query.tags.length > 0) {
      artifacts = artifacts.filter((a) =>
        query.tags!.every((tag) => a.tags.includes(tag))
      );
    }

    // Filter by visibility
    if (query.visibility) {
      artifacts = artifacts.filter((a) => a.visibility === query.visibility);
    }

    // Search in title and description
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      artifacts = artifacts.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          (a.description && a.description.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    artifacts.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortBy === 'title') {
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
      } else {
        aValue = a[sortBy].getTime();
        bValue = b[sortBy].getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    const total = artifacts.length;

    // Pagination
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    artifacts = artifacts.slice(offset, offset + limit);

    return {
      artifacts,
      total,
      offset,
      limit,
    };
  }

  async update(id: string, input: UpdateArtifactInput): Promise<Artifact> {
    const artifact = this.artifacts.get(id);

    if (!artifact) {
      throw new Error('Artifact not found');
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
      throw new Error('Artifact not found');
    }

    this.artifacts.delete(id);
  }
}
