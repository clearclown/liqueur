/**
 * Artifact Share API
 *
 * POST /api/liquid/artifacts/:id/share - 共有リンク生成
 * DELETE /api/liquid/artifacts/:id/share - 共有停止
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// 共有トークンストア（本番ではRedis/DBを使用）
const shareTokens = new Map<string, {
  artifactId: string;
  visibility: 'public' | 'private' | 'team';
  expiresAt?: Date;
  password?: string;
  permissions: 'read' | 'write';
  createdAt: Date;
}>();

interface ShareRequest {
  visibility?: 'public' | 'private' | 'team';
  expiresAt?: string; // ISO 8601
  password?: string;
  permissions?: 'read' | 'write';
}

/**
 * POST /api/liquid/artifacts/:id/share
 * 共有リンク生成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const artifactId = params.id;
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

    shareTokens.set(token, {
      artifactId,
      visibility,
      expiresAt,
      password: body.password,
      permissions,
      createdAt: new Date(),
    });

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
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const artifactId = params.id;

    // 該当するトークンを全て削除
    let deletedCount = 0;
    for (const [token, share] of shareTokens.entries()) {
      if (share.artifactId === artifactId) {
        shareTokens.delete(token);
        deletedCount++;
      }
    }

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

/**
 * 共有トークンストアにアクセスするためのヘルパー関数
 */
export function getShareByToken(token: string) {
  const share = shareTokens.get(token);

  if (!share) {
    return null;
  }

  // 有効期限チェック
  if (share.expiresAt && share.expiresAt <= new Date()) {
    shareTokens.delete(token);
    return null;
  }

  return share;
}

export function validateSharePassword(token: string, password: string): boolean {
  const share = shareTokens.get(token);

  if (!share) {
    return false;
  }

  // パスワード保護されていない場合はtrue
  if (!share.password) {
    return true;
  }

  return share.password === password;
}
