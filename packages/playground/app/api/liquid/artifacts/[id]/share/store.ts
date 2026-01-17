/**
 * Share Store
 * 共有リンクデータ管理
 */

export interface ShareData {
  artifactId: string;
  visibility: 'public' | 'private' | 'team';
  expiresAt?: Date;
  password?: string;
  permissions: 'read' | 'write';
  createdAt: Date;
}

// 共有トークンストア（本番ではRedis/DBを使用）
const shareTokens = new Map<string, ShareData>();

/**
 * 共有トークンを作成
 */
export function createShare(token: string, data: ShareData): ShareData {
  shareTokens.set(token, data);
  return data;
}

/**
 * 共有トークンを取得
 */
export function getShareByToken(token: string): ShareData | null {
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

/**
 * パスワード検証
 */
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

/**
 * Artifact IDで共有を削除
 */
export function deleteSharesByArtifactId(artifactId: string): number {
  let deletedCount = 0;
  for (const [token, share] of shareTokens.entries()) {
    if (share.artifactId === artifactId) {
      shareTokens.delete(token);
      deletedCount++;
    }
  }
  return deletedCount;
}
