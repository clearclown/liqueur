/**
 * Artifact Share API
 *
 * POST /api/liquid/artifacts/:id/share - 共有リンク生成
 * DELETE /api/liquid/artifacts/:id/share - 共有停止
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createShare, deleteSharesByArtifactId, type ShareData } from './store';

interface ShareRequest {
  visibility?: 'public' | 'private' | 'team';
  expiresAt?: string; // ISO 8601
  password?: string;
  permissions?: 'read' | 'write';
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/liquid/artifacts/:id/share
 * 共有リンク生成
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id: artifactId } = await context.params;
    const body: ShareRequest = await request.json();

    // バリデーション
    if (!artifactId || artifactId.length === 0) {
      return NextResponse.json(
        { error: 'Artifact ID is required' },
        { status: 400 }
      );
    }

    const visibility = body.visibility || 'private';
    const permissions = body.permissions || 'read';
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

    // 有効期限チェック
    if (expiresAt && expiresAt <= new Date()) {
      return NextResponse.json(
        { error: 'Expiration date must be in the future' },
        { status: 400 }
      );
    }

    // 共有トークン生成
    const token = randomBytes(32).toString('hex');

    const shareData: ShareData = {
      artifactId,
      visibility,
      expiresAt,
      password: body.password,
      permissions,
      createdAt: new Date(),
    };

    createShare(token, shareData);

    return NextResponse.json({
      token,
      shareUrl: `${request.nextUrl.origin}/shared/${token}`,
      visibility,
      permissions,
      expiresAt: expiresAt?.toISOString(),
    }, { status: 201 });

  } catch (error) {
    console.error('Share creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/liquid/artifacts/:id/share
 * 共有停止
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id: artifactId } = await context.params;

    // 該当するトークンを全て削除
    const deletedCount = deleteSharesByArtifactId(artifactId);

    if (deletedCount === 0) {
      return NextResponse.json(
        { error: 'No share links found for this artifact' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Deleted ${deletedCount} share link(s)`,
      deletedCount,
    }, { status: 200 });

  } catch (error) {
    console.error('Share deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete share link' },
      { status: 500 }
    );
  }
}
