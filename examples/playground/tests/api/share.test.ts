/**
 * Share API Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { POST as createShare, DELETE as deleteShare, getShareByToken } from '../../app/api/liquid/artifacts/[id]/share/route';
import { GET as getSharedArtifact } from '../../app/api/liquid/shared/[token]/route';
import { NextRequest } from 'next/server';

describe('Share API', () => {
  describe('POST /api/liquid/artifacts/:id/share', () => {
    it('should create a share link with default settings', async () => {
      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-1/share', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await createShare(request, { params: { id: 'artifact-1' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.token).toBeDefined();
      expect(data.shareUrl).toContain(data.token);
      expect(data.visibility).toBe('private');
      expect(data.permissions).toBe('read');
    });

    it('should create a share link with custom settings', async () => {
      const expiresAt = new Date(Date.now() + 86400000).toISOString(); // 24時間後

      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-2/share', {
        method: 'POST',
        body: JSON.stringify({
          visibility: 'public',
          permissions: 'write',
          expiresAt,
          password: 'secret123',
        }),
      });

      const response = await createShare(request, { params: { id: 'artifact-2' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.visibility).toBe('public');
      expect(data.permissions).toBe('write');
      expect(data.expiresAt).toBe(expiresAt);
    });

    it('should reject share link with past expiration date', async () => {
      const expiresAt = new Date(Date.now() - 86400000).toISOString(); // 24時間前

      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-3/share', {
        method: 'POST',
        body: JSON.stringify({ expiresAt }),
      });

      const response = await createShare(request, { params: { id: 'artifact-3' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('future');
    });

    it('should reject empty artifact ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts//share', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await createShare(request, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });
  });

  describe('DELETE /api/liquid/artifacts/:id/share', () => {
    it('should delete all share links for an artifact', async () => {
      // まず共有リンクを作成
      const createRequest = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-4/share', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      await createShare(createRequest, { params: { id: 'artifact-4' } });

      // 削除
      const deleteRequest = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-4/share', {
        method: 'DELETE',
      });

      const response = await deleteShare(deleteRequest, { params: { id: 'artifact-4' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.deletedCount).toBeGreaterThan(0);
    });

    it('should return 404 when no share links exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/nonexistent/share', {
        method: 'DELETE',
      });

      const response = await deleteShare(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('No share links found');
    });
  });

  describe('getShareByToken', () => {
    it('should return null for expired shares', async () => {
      const expiresAt = new Date(Date.now() + 100); // 100ms後に期限切れ

      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-5/share', {
        method: 'POST',
        body: JSON.stringify({ expiresAt: expiresAt.toISOString() }),
      });

      const response = await createShare(request, { params: { id: 'artifact-5' } });
      const data = await response.json();
      const { token } = data;

      // 期限切れまで待機
      await new Promise(resolve => setTimeout(resolve, 150));

      const share = getShareByToken(token);
      expect(share).toBeNull();
    });

    it('should return share for valid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/liquid/artifacts/artifact-6/share', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await createShare(request, { params: { id: 'artifact-6' } });
      const data = await response.json();
      const { token } = data;

      const share = getShareByToken(token);
      expect(share).toBeDefined();
      expect(share?.artifactId).toBe('artifact-6');
    });
  });
});
