import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryArtifactStore } from '../src/stores/InMemoryArtifactStore';
import type { CreateArtifactInput } from '../src/types';

describe('InMemoryArtifactStore', () => {
  let store: InMemoryArtifactStore;
  let mockUserId: string;

  beforeEach(() => {
    store = new InMemoryArtifactStore();
    mockUserId = 'user-123';
  });

  const createSampleInput = (): CreateArtifactInput => ({
    title: 'Sales Dashboard',
    description: 'Monthly sales analytics',
    schema: {
      version: '1.0',
      layout: { type: 'grid', columns: 2 },
      components: [
        {
          type: 'chart',
          variant: 'bar',
          title: 'Sales',
          data_source: 'ds_sales',
        },
      ],
      data_sources: {
        ds_sales: {
          resource: 'sales',
        },
      },
    },
    tags: ['sales', 'dashboard'],
    visibility: 'private',
  });

  describe('create', () => {
    it('should create artifact with auto-generated ID', async () => {
      const input = createSampleInput();

      const artifact = await store.create(input, mockUserId);

      expect(artifact.id).toBeDefined();
      expect(artifact.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(artifact.title).toBe(input.title);
      expect(artifact.userId).toBe(mockUserId);
    });

    it('should create artifact with version 1', async () => {
      const input = createSampleInput();

      const artifact = await store.create(input, mockUserId);

      expect(artifact.version).toBe(1);
    });

    it('should create artifact with timestamps', async () => {
      const input = createSampleInput();

      const artifact = await store.create(input, mockUserId);

      expect(artifact.createdAt).toBeInstanceOf(Date);
      expect(artifact.updatedAt).toBeInstanceOf(Date);
      expect(artifact.createdAt.getTime()).toBeLessThanOrEqual(artifact.updatedAt.getTime());
    });

    it('should create artifact with default empty tags', async () => {
      const input = { ...createSampleInput(), tags: undefined };

      const artifact = await store.create(input, mockUserId);

      expect(artifact.tags).toEqual([]);
    });

    it('should create artifact with default private visibility', async () => {
      const input = { ...createSampleInput(), visibility: undefined };

      const artifact = await store.create(input, mockUserId);

      expect(artifact.visibility).toBe('private');
    });

    it('should throw error for empty title', async () => {
      const input = { ...createSampleInput(), title: '' };

      await expect(store.create(input, mockUserId)).rejects.toThrow('Title cannot be empty');
    });
  });

  describe('get', () => {
    it('should retrieve created artifact by ID', async () => {
      const input = createSampleInput();
      const created = await store.create(input, mockUserId);

      const artifact = await store.get(created.id);

      expect(artifact).not.toBeNull();
      expect(artifact?.id).toBe(created.id);
      expect(artifact?.title).toBe(input.title);
    });

    it('should return null for non-existent ID', async () => {
      const artifact = await store.get('non-existent-id');

      expect(artifact).toBeNull();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Create multiple artifacts
      await store.create(
        { ...createSampleInput(), title: 'Dashboard 1', tags: ['sales'] },
        mockUserId
      );
      await store.create(
        { ...createSampleInput(), title: 'Dashboard 2', tags: ['users'] },
        mockUserId
      );
      await store.create(
        { ...createSampleInput(), title: 'Dashboard 3', tags: ['sales', 'users'] },
        'user-456'
      );
    });

    it('should list all artifacts for user', async () => {
      const result = await store.list({ userId: mockUserId });

      expect(result.artifacts).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.artifacts.every((a) => a.userId === mockUserId)).toBe(true);
    });

    it('should filter by tags', async () => {
      const result = await store.list({ userId: mockUserId, tags: ['sales'] });

      expect(result.artifacts).toHaveLength(1);
      expect(result.artifacts[0].title).toBe('Dashboard 1');
    });

    it('should support pagination', async () => {
      const result = await store.list({ userId: mockUserId, offset: 0, limit: 1 });

      expect(result.artifacts).toHaveLength(1);
      expect(result.total).toBe(2);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(1);
    });

    it('should search in title', async () => {
      const result = await store.list({ userId: mockUserId, search: 'Dashboard 2' });

      expect(result.artifacts).toHaveLength(1);
      expect(result.artifacts[0].title).toBe('Dashboard 2');
    });

    it('should sort by createdAt desc by default', async () => {
      const result = await store.list({ userId: mockUserId });

      expect(result.artifacts[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        result.artifacts[1].createdAt.getTime()
      );
    });
  });

  describe('update', () => {
    it('should update artifact fields', async () => {
      const input = createSampleInput();
      const created = await store.create(input, mockUserId);

      const updated = await store.update(created.id, {
        title: 'Updated Title',
        tags: ['updated'],
      });

      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.tags).toEqual(['updated']);
      expect(updated.description).toBe(created.description); // Unchanged
    });

    it('should increment version on update', async () => {
      const input = createSampleInput();
      const created = await store.create(input, mockUserId);

      const updated = await store.update(created.id, { title: 'Updated' });

      expect(updated.version).toBe(2);
    });

    it('should update updatedAt timestamp', async () => {
      const input = createSampleInput();
      const created = await store.create(input, mockUserId);

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await store.update(created.id, { title: 'Updated' });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should throw error for non-existent artifact', async () => {
      await expect(store.update('non-existent-id', { title: 'Updated' })).rejects.toThrow(
        'Artifact not found'
      );
    });
  });

  describe('delete', () => {
    it('should delete artifact', async () => {
      const input = createSampleInput();
      const created = await store.create(input, mockUserId);

      await store.delete(created.id);

      const artifact = await store.get(created.id);
      expect(artifact).toBeNull();
    });

    it('should throw error for non-existent artifact', async () => {
      await expect(store.delete('non-existent-id')).rejects.toThrow('Artifact not found');
    });
  });
});
