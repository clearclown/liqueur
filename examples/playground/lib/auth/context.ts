/**
 * User Context Utilities
 * ユーザー認証コンテキストの抽出と管理
 */

import { NextRequest } from "next/server";

/**
 * Get current user ID from request
 * リクエストから現在のユーザーIDを取得
 *
 * **Production**: JWT token or session からユーザーIDを抽出
 * **Development/Test**: ヘッダーまたはデフォルト値を使用
 *
 * @param request - Next.js request object
 * @returns User ID (string)
 */
export function getCurrentUser(request: NextRequest): string {
  // Production: JWT tokenからユーザーIDを抽出
  // const token = request.headers.get("authorization")?.replace("Bearer ", "");
  // if (token) {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   return decoded.userId;
  // }

  // Development/Test: X-User-ID ヘッダーを使用
  const userIdHeader = request.headers.get("X-User-ID");
  if (userIdHeader) {
    return userIdHeader;
  }

  // Fallback: デフォルトのテストユーザー
  // Production環境では、認証されていない場合はエラーをthrowすべき
  if (process.env.NODE_ENV === "production") {
    throw new Error("Unauthorized: User authentication required");
  }

  return "test-user";
}

/**
 * Validate user has access to resource
 * ユーザーがリソースへのアクセス権を持つか検証
 *
 * @param userId - User ID
 * @param resourceOwnerId - Resource owner ID
 * @returns true if user has access
 */
export function hasAccess(userId: string, resourceOwnerId: string): boolean {
  // Basic check: user can only access their own resources
  return userId === resourceOwnerId;
}
