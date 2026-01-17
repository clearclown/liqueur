/**
 * Comments API Tests
 */

import { describe, it, expect } from 'vitest';
import { POST as createComment, GET as getComments } from '../../app/api/liquid/artifacts/[id]/comments/route';
import { PUT as updateComment, DELETE as deleteComment } from '../../app/api/liquid/artifacts/[id]/comments/[commentId]/route';
import { NextRequest } from 'next/server';

describe('Comments API', () => {
  describe('POST /api/liquid/artifacts/:id/comments', () => {
    it('should create a comment', async () => {
      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-1/comments', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          userName: 'Test User',
          content: 'This is a test comment',
        }),
      });

      const response = await createComment(request, { params: { id: 'artifact-1' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.artifactId).toBe('artifact-1');
      expect(data.userId).toBe('user-1');
      expect(data.userName).toBe('Test User');
      expect(data.content).toBe('This is a test comment');
      expect(data.createdAt).toBeDefined();
    });

    it('should reject empty comment content', async () => {
      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-2/comments', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          userName: 'Test User',
          content: '   ',
        }),
      });

      const response = await createComment(request, { params: { id: 'artifact-2' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('should reject comment exceeding max length', async () => {
      const longContent = 'a'.repeat(5001);

      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-3/comments', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          userName: 'Test User',
          content: longContent,
        }),
      });

      const response = await createComment(request, { params: { id: 'artifact-3' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('maximum length');
    });

    it('should use default values for anonymous users', async () => {
      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-4/comments', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Anonymous comment',
        }),
      });

      const response = await createComment(request, { params: { id: 'artifact-4' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.userId).toBe('anonymous');
      expect(data.userName).toBe('Anonymous User');
    });
  });

  describe('GET /api/liquid/artifacts/:id/comments', () => {
    it('should retrieve comments for an artifact', async () => {
      // まずコメントを作成
      const createRequest = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-5/comments', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          userName: 'Test User',
          content: 'First comment',
        }),
      });

      await createComment(createRequest, { params: { id: 'artifact-5' } });

      // コメント取得
      const getRequest = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-5/comments', {
        method: 'GET',
      });

      const response = await getComments(getRequest, { params: { id: 'artifact-5' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comments).toBeDefined();
      expect(data.total).toBeGreaterThan(0);
      expect(data.comments[0].artifactId).toBe('artifact-5');
    });

    it('should return empty array for artifact with no comments', async () => {
      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-empty/comments', {
        method: 'GET',
      });

      const response = await getComments(request, { params: { id: 'artifact-empty' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comments).toEqual([]);
      expect(data.total).toBe(0);
    });
  });

  describe('PUT /api/liquid/artifacts/:id/comments/:commentId', () => {
    it('should update a comment', async () => {
      // まずコメントを作成
      const createRequest = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-6/comments', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          userName: 'Test User',
          content: 'Original content',
        }),
      });

      const createResponse = await createComment(createRequest, { params: { id: 'artifact-6' } });
      const createdComment = await createResponse.json();

      // コメント更新
      const updateRequest = new NextRequest(
        `http://localhost:3000/api/liquid/artifacts/artifact-6/comments/${createdComment.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            content: 'Updated content',
          }),
        }
      );

      const response = await updateComment(updateRequest, {
        params: { id: 'artifact-6', commentId: createdComment.id }
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBe('Updated content');
      expect(data.updatedAt).not.toBe(data.createdAt);
    });

    it('should reject empty content update', async () => {
      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-7/comments/comment-1', {
        method: 'PUT',
        body: JSON.stringify({
          content: '   ',
        }),
      });

      const response = await updateComment(request, {
        params: { id: 'artifact-7', commentId: 'comment-1' }
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('should return 404 for nonexistent comment', async () => {
      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-8/comments/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({
          content: 'Updated content',
        }),
      });

      const response = await updateComment(request, {
        params: { id: 'artifact-8', commentId: 'nonexistent' }
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('DELETE /api/liquid/artifacts/:id/comments/:commentId', () => {
    it('should delete a comment', async () => {
      // まずコメントを作成
      const createRequest = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-9/comments', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          userName: 'Test User',
          content: 'Comment to delete',
        }),
      });

      const createResponse = await createComment(createRequest, { params: { id: 'artifact-9' } });
      const createdComment = await createResponse.json();

      // コメント削除
      const deleteRequest = new NextRequest(
        `http://localhost:3000/api/liquid/artifacts/artifact-9/comments/${createdComment.id}`,
        {
          method: 'DELETE',
        }
      );

      const response = await deleteComment(deleteRequest, {
        params: { id: 'artifact-9', commentId: createdComment.id }
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('deleted successfully');
    });

    it('should return 404 for nonexistent comment', async () => {
      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-10/comments/nonexistent', {
        method: 'DELETE',
      });

      const response = await deleteComment(request, {
        params: { id: 'artifact-10', commentId: 'nonexistent' }
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });
});
