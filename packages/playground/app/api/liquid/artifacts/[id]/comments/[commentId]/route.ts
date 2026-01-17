/**
 * Individual Comment API
 *
 * PUT /api/liquid/artifacts/:id/comments/:commentId - コメント更新
 * DELETE /api/liquid/artifacts/:id/comments/:commentId - コメント削除
 */

import { NextRequest, NextResponse } from 'next/server';
import { getComment, deleteComment, updateComment } from '../route';

interface UpdateCommentRequest {
  content: string;
}

/**
 * PUT /api/liquid/artifacts/:id/comments/:commentId
 * コメント更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
): Promise<NextResponse> {
  try {
    const { commentId } = params;
    const body: UpdateCommentRequest = await request.json();

    // バリデーション
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

    // コメント更新
    const updatedComment = updateComment(commentId, body.content);

    if (!updatedComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedComment, { status: 200 });

  } catch (error) {
    console.error('Comment update error:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/liquid/artifacts/:id/comments/:commentId
 * コメント削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
): Promise<NextResponse> {
  try {
    const { commentId } = params;

    // コメント削除
    const deleted = deleteComment(commentId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Comment deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Comment deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
