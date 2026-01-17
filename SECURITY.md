# Security Policy

Project Liquidはセキュリティを最優先事項として設計されています。

## サポートバージョン

| Version | Supported          |
|---------|--------------------|
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## 脆弱性の報告

セキュリティ脆弱性を発見した場合:

1. **公開しないでください** - GitHubのPublic Issueには投稿しないでください
2. **GitHub Security Advisories**を使用してください
   - [Security Advisories](https://github.com/clearclown/liqueur/security/advisories/new)で非公開報告
3. **対応目標**: 48時間以内に初回応答

### 報告に含めるべき情報

- 脆弱性の詳細な説明
- 再現手順
- 影響範囲の評価
- 可能であれば修正案

## セキュリティ設計原則

Project Liquidは「**AIにコードを書かせない**」という根本原則に基づいています。

### 1. No Arbitrary Code Execution（任意コード実行の排除）

```
従来のAI UI生成:
  User → AI → JavaScript/SQL生成 → 実行 → XSS/SQLインジェクション

Liquidのアプローチ:
  User → AI → JSONスキーマのみ → Rust型検証 → 安全なORM実行
```

**AIが生成できるもの**:
- JSONスキーマ（UIコンポーネント定義）
- DataSource定義（フィルタ、集計、ソート）

**AIが生成できないもの**:
- JavaScript/TypeScriptコード
- SQLクエリ
- シェルコマンド
- 任意の実行可能コード

### 2. Fail Fast（即座に失敗）

Rust型システムによる厳格な検証:

```rust
// 定義外フィールドは即座にエラー
#[serde(deny_unknown_fields)]
pub struct LiquidViewSchema {
    pub version: String,
    pub components: Vec<Component>,
    // ...
}
```

- 不正なスキーマは実行前に拒否
- 型安全性により想定外の動作を防止
- エラーメッセージは詳細だが安全

### 3. Row-Level Security（行レベルセキュリティ）

```rust
// 全クエリにユーザーコンテキストを強制適用
pub fn apply_rls(query: Query, user: &CurrentUser) -> Query {
    query.where_clause(format!("user_id = {}", user.id))
}
```

- ユーザーは自分のデータのみアクセス可能
- 管理者でも明示的な権限なしに他ユーザーデータにアクセス不可
- デフォルトで最小権限原則を適用

### 4. Defense in Depth（多層防御）

```
Layer 1: 入力検証（TypeScript）
  ↓ Validated Input
Layer 2: スキーマ検証（Rust型システム）
  ↓ Safe Schema
Layer 3: DataSource変換（ORM専用）
  ↓ Safe Query
Layer 4: Row-Level Security
  ↓ Authorized Data
Layer 5: 出力エンコーディング（React自動エスケープ）
```

## 実装されているセキュリティ対策

### レート制限

```typescript
// DDoS保護: 10リクエスト/分
const rateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
});
```

### 入力検証

```typescript
// 全ての入力を検証
function validateString(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') throw new ValidationError();
  if (input.length > maxLength) throw new ValidationError();
  return sanitize(input);
}
```

### Content Security Policy

フロントエンドでは厳格なCSPを推奨:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
```

## セキュリティチェックリスト（開発者向け）

新機能追加時に確認:

- [ ] AIの出力がJSONスキーマのみであることを確認
- [ ] 新しいフィールドがRust型定義に追加されているか
- [ ] Row-Level Securityが適用されているか
- [ ] 入力検証が実装されているか
- [ ] エラーメッセージに機密情報が含まれていないか
- [ ] テストでセキュリティケースがカバーされているか

## 依存関係のセキュリティ

```bash
# npm依存関係の監査
npm audit

# Rustクレートの監査
cargo audit
```

定期的に依存関係を更新し、既知の脆弱性を排除してください。

## 謝辞

セキュリティ研究者の皆様のご協力に感謝いたします。
責任ある開示にご協力いただいた方は、許可を得た上でこの文書で謝辞を掲載させていただきます。
