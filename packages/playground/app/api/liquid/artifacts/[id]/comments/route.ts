/**
 * Artifact Comments API
 *
 * POST /api/liquid/artifacts/:id/comments - コメント作成
 * GET /api/liquid/artifacts/:id/comments - コメント一覧取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createComment, getCommentsByArtifactId, type Comment } from './store';

interface CreateCommentRequest {
  userId: string;
  userName: string;
  content: string;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/liquid/artifacts/:id/comments
 * コメント作成
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id: artifactId } = await context.params;
    const body: CreateCommentRequest = await request.json();

    // バリデーション
    if (!artifactId || artifactId.length === 0) {
      return NextResponse.json(
        { error: 'Artifact ID is required' },
        { status: 400 }
      );
    }

    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (body.content.length > 5000) {
      return NextResponse.json(
        { error: 'Comment content exceeds maximum length (5000 characters)' },
        { status: 400 }
      );
    }

    // コメント作成
    const commentId = randomBytes(16).toString('hex');
    const now = new Date();

    const comment: Comment = {
      id: commentId,
      artifactId,
      userId: body.userId || 'anonymous',
      userName: body.userName || 'Anonymous User',
      content: body.content.trim(),
      createdAt: now,
      updatedAt: now,
    };

    createComment(comment);

    return NextResponse.json(comment, { status: 201 });

  } catch (error) {
    console.error('Comment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/liquid/artifacts/:id/comments
 * コメント一覧取得
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id: artifactId } = await context.params;

    // Artifact IDでフィルタリング
    const artifactComments = getCommentsByArtifactId(artifactId);

    return NextResponse.json({
      comments: artifactComments,
      total: artifactComments.length,
    }, { status: 200 });

  } catch (error) {
    console.error('Comments retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve comments' },
      { status: 500 }
    );
  }
}
