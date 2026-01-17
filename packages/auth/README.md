# @liqueur/auth

Project Liquidの認証・認可パッケージ

## 機能

- **JWT認証**: JSON Web Tokenベースの認証
- **Session認証**: サーバーサイドセッション管理
- **RBAC**: Role-Based Access Control（ロールベースアクセス制御）
- **ミドルウェア**: Next.js/Express対応の認証ミドルウェア

## インストール

```bash
npm install @liqueur/auth
```

## 使用方法

### JWT認証

```typescript
import { JWTProvider } from '@liqueur/auth';

const jwtProvider = new JWTProvider({
  secret: process.env.JWT_SECRET!,
  expiresIn: '7d',
});

// トークン生成
const token = await jwtProvider.sign({ userId: '123', role: 'user' });

// トークン検証
const payload = await jwtProvider.verify(token);
```

### Session認証

```typescript
import { SessionProvider } from '@liqueur/auth';

const sessionProvider = new SessionProvider({
  secret: process.env.SESSION_SECRET!,
  maxAge: 60 * 60 * 24 * 7, // 7日
});

// セッション作成
const sessionId = await sessionProvider.create({ userId: '123' });

// セッション取得
const session = await sessionProvider.get(sessionId);
```

### 認証ミドルウェア

```typescript
import { createAuthMiddleware, getUserFromRequest } from '@liqueur/auth';

// Express/Next.js API Route
const authMiddleware = createAuthMiddleware({
  provider: jwtProvider,
});

// ユーザー取得
const user = getUserFromRequest(req);
```

### RBACミドルウェア

```typescript
import { createRBACMiddleware, checkPermission } from '@liqueur/auth';

const rbacMiddleware = createRBACMiddleware({
  requiredPermission: 'artifacts:write',
});

// 権限チェック
if (checkPermission(user, 'artifacts:read')) {
  // アクセス許可
}
```

## API リファレンス

### Providers

| クラス | 説明 |
|--------|------|
| `JWTProvider` | JWT認証プロバイダー |
| `SessionProvider` | Session認証プロバイダー |

### Middleware

| 関数 | 説明 |
|------|------|
| `createAuthMiddleware` | 認証ミドルウェア作成 |
| `getUserFromRequest` | リクエストからユーザー取得 |
| `createRBACMiddleware` | RBACミドルウェア作成 |
| `checkPermission` | 権限チェック |

### Types

| 型 | 説明 |
|----|------|
| `User` | ユーザー情報 |
| `UserRole` | ユーザーロール（admin, user, guest） |
| `JWTPayload` | JWTペイロード |
| `SessionData` | セッションデータ |
| `AuthResult` | 認証結果 |
| `Permission` | 権限定義 |

## ライセンス

MIT
