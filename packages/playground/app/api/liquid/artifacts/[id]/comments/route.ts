/**
 * Artifact Comments API
 *
 * POST /api/liquid/artifacts/:id/comments - コメント作成
 * GET /api/liquid/artifacts/:id/comments - コメント一覧取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

interface Comment {
  id: string;
  artifactId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// コメントストア（本番ではDBを使用）
const comments = new Map<string, Comment>();

interface CreateCommentRequest {
  userId: string;
  userName: string;
  content: string;
}

/**
 * POST /api/liquid/artifacts/:id/comments
 * コメント作成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const artifactId = params.id;
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

    comments.set(commentId, comment);

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
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const artifactId = params.id;

    // Artifact IDでフィルタリング
    const artifactComments = Array.from(comments.values())
      .filter(comment => comment.artifactId === artifactId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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

/**
 * コメントストアにアクセスするためのヘルパー関数
 */
export function getComment(commentId: string): Comment | undefined {
  return comments.get(commentId);
}

export function deleteComment(commentId: string): boolean {
  return comments.delete(commentId);
}

export function updateComment(commentId: string, content: string): Comment | null {
  const comment = comments.get(commentId);

  if (!comment) {
    return null;
  }

  comment.content = content.trim();
  comment.updatedAt = new Date();

  comments.set(commentId, comment);

  return comment;
}
