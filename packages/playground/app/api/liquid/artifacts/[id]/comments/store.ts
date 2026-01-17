/**
 * Comment Store
 * コメントデータ管理
 */

export interface Comment {
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

/**
 * コメントを作成
 */
export function createComment(comment: Comment): Comment {
  comments.set(comment.id, comment);
  return comment;
}

/**
 * コメントを取得
 */
export function getComment(commentId: string): Comment | undefined {
  return comments.get(commentId);
}

/**
 * コメントを削除
 */
export function deleteComment(commentId: string): boolean {
  return comments.delete(commentId);
}

/**
 * コメントを更新
 */
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

/**
 * ArtifactIDでコメント一覧を取得
 */
export function getCommentsByArtifactId(artifactId: string): Comment[] {
  return Array.from(comments.values())
    .filter(comment => comment.artifactId === artifactId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
