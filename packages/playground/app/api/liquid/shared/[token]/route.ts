/**
 * Shared Artifact API
 *
 * GET /api/liquid/shared/:token - 共有リンクからArtifact取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShareByToken, validateSharePassword } from '../../artifacts/[id]/share/route';
import { FileStore } from '@liqueur/artifact-store';
import path from 'path';

const artifactStore = new FileStore({
  baseDir: path.join(process.cwd(), '.artifacts'),
});

/**
 * GET /api/liquid/shared/:token
 * 共有リンクからArtifact取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  try {
    const { token } = params;
    const password = request.nextUrl.searchParams.get('password');

    // 共有情報を取得
    const share = getShareByToken(token);

    if (!share) {
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 }
      );
    }

    // パスワード検証
    if (share.password && (!password || !validateSharePassword(token, password))) {
      return NextResponse.json(
        { error: 'Invalid password', requiresPassword: true },
        { status: 401 }
      );
    }

    // Artifactを取得
    const artifact = await artifactStore.get(share.artifactId);

    if (!artifact) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      artifact,
      visibility: share.visibility,
      permissions: share.permissions,
      expiresAt: share.expiresAt?.toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('Shared artifact retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shared artifact' },
      { status: 500 }
    );
  }
}
