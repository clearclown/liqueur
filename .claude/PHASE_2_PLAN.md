# Phase 2 実装計画

## Phase 2 概要

**目的**: バックエンド統合とRustクレート実装により、実際のデータベースクエリを可能にする

**期間**: Week 4-6（予定）

**前提条件**: Phase 1完了
- ✅ TypeScript Protocol定義完了（型、バリデーター）
- ✅ React UI Components完了（LiquidRenderer, useLiquidView）
- ✅ 98テスト全てパス
- ✅ 型安全性確保

---

## Phase 2 スコープ

### 実装対象

#### 1. Rust Protocol Implementation (FR-06の基盤)
**パッケージ**: `crates/liquid-protocol`

**タスク**:
- [ ] Serde構造体定義（TypeScript型定義との完全一致）
  - `LiquidViewSchema`
  - `GridLayout`, `StackLayout`
  - `ChartComponent`, `TableComponent`
  - `DataSource`, `Filter`, `Aggregation`, `Sort`
- [ ] JSON roundtrip テスト（TypeScript ↔ Rust）
- [ ] バリデーター実装（TypeScriptと同等）
- [ ] カバレッジ95%以上

**成果物**:
- `crates/liquid-protocol/src/schema.rs` - Serde構造体
- `crates/liquid-protocol/src/validator.rs` - バリデーター
- `crates/liquid-protocol/tests/*_test.rs` - 包括的テスト

---

#### 2. DataSource → ORM Conversion (FR-06)
**パッケージ**: `crates/liquid-reinhardt`

**タスク**:
- [ ] reinhardt-web サブモジュール統合
- [ ] DataSource → reinhardt-db Query変換ロジック
  - Filter operators変換（eq, neq, gt, gte, lt, lte, in, contains）
  - Aggregation変換（sum, avg, count, min, max）
  - Sort変換（asc, desc）
  - Limit適用
- [ ] エラーハンドリング（不正フィルタ、存在しないリソース）
- [ ] 統合テスト（モックDBクエリ）
- [ ] カバレッジ95%以上

**成果物**:
- `crates/liquid-reinhardt/src/converter.rs` - DataSource変換ロジック
- `crates/liquid-reinhardt/tests/converter_test.rs` - 変換テスト

**例**:
```rust
// Input: DataSource
DataSource {
    resource: "expenses",
    filters: vec![
        Filter { field: "category", op: FilterOp::Neq, value: "travel" }
    ],
    aggregation: Some(Aggregation {
        type: AggType::Sum,
        field: "amount",
        by: Some("month")
    }),
    sort: Some(Sort { field: "amount_sum", direction: "desc" }),
    limit: Some(10)
}

// Output: reinhardt-db Query (疑似コード)
SELECT month, SUM(amount) as amount_sum
FROM expenses
WHERE category != 'travel' AND user_id = $current_user_id
GROUP BY month
ORDER BY amount_sum DESC
LIMIT 10
```

---

#### 3. Row-Level Security (FR-07)
**パッケージ**: `crates/liquid-reinhardt`

**タスク**:
- [ ] CurrentUserコンテキスト定義
- [ ] Security Policy trait定義
- [ ] デフォルトポリシー実装（`WHERE user_id = current_user.id`）
- [ ] カスタムポリシーサポート
- [ ] セキュリティテスト（権限外データアクセス防止）
- [ ] カバレッジ100%

**成果物**:
- `crates/liquid-reinhardt/src/security.rs` - RLS実装
- `crates/liquid-reinhardt/tests/security_test.rs` - セキュリティテスト

**セキュリティ原則**:
1. **全てのクエリにCurrentUser強制**: 必ず`user_id`でフィルタ
2. **デフォルトDeny**: ポリシー未定義リソースは拒否
3. **監査ログ**: 全てのクエリ実行を記録（Phase 3）

---

#### 4. Backend API Endpoint (Phase 2.5 - オプション)
**パッケージ**: 新規 `crates/liquid-api` または reinhardt-web拡張

**タスク**:
- [ ] `/api/liquid/query` エンドポイント実装
  - POST: `{ dataSource: DataSource }` → `{ data: unknown[] }`
  - 認証チェック（JWT/Session）
  - RLS適用
  - レート制限
- [ ] エラーレスポンス（400, 401, 403, 500）
- [ ] OpenAPI/Swagger ドキュメント

**成果物**:
- REST APIエンドポイント
- APIドキュメント

---

## 実装戦略

### TDD Approach

**Red-Green-Refactor Cycle厳守**:

#### Rust TDD Example

```bash
# 1. RED: 失敗するテストを作成
cd crates/liquid-protocol
cargo watch -x test

# tests/roundtrip_test.rs
#[test]
fn test_serde_roundtrip() {
    let schema = LiquidViewSchema {
        version: "1.0".to_string(),
        layout: Layout::Grid(GridLayout { columns: 2, gap: Some(16) }),
        components: vec![],
        data_sources: HashMap::new(),
    };

    let json = serde_json::to_string(&schema).unwrap();
    let deserialized: LiquidViewSchema = serde_json::from_str(&json).unwrap();

    assert_eq!(schema, deserialized);
}

# 2. GREEN: 最小実装
# src/schema.rs
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LiquidViewSchema {
    pub version: String,
    pub layout: Layout,
    pub components: Vec<Component>,
    pub data_sources: HashMap<String, DataSource>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum Layout {
    Grid(GridLayout),
    Stack(StackLayout),
}

# 3. REFACTOR: 改善
# 4. COVERAGE: 確認
cargo tarpaulin --out Html
```

---

### TypeScript ↔ Rust 型一致性保証

**戦略**:
1. **共通JSONテストケース**: `tests/fixtures/valid_schemas.json`
2. **両言語でパース**: TypeScript validator + Rust deserializer
3. **CI/CD自動検証**: 不一致で即座にビルド失敗

**Example Fixture**:
```json
{
  "version": "1.0",
  "layout": { "type": "grid", "columns": 2, "gap": 16 },
  "components": [
    {
      "type": "chart",
      "variant": "bar",
      "title": "Sales",
      "data_source": "ds_sales"
    }
  ],
  "data_sources": {
    "ds_sales": {
      "resource": "sales",
      "filters": [{ "field": "status", "op": "eq", "value": "completed" }],
      "aggregation": { "type": "sum", "field": "amount", "by": "month" }
    }
  }
}
```

---

## Phase 2 実装順序

### Week 4: Rust Protocol Foundation
1. **Day 1-2**: Serde構造体定義
   - `schema.rs` 全型定義
   - JSON roundtrip テスト作成
2. **Day 3-4**: Validator実装
   - TypeScriptバリデーターのRust移植
   - 全バリデーションルールテスト
3. **Day 5**: ドキュメント・統合テスト
   - cargo doc生成
   - TypeScript ↔ Rust 相互運用テスト

### Week 5: DataSource Conversion & RLS
1. **Day 1-3**: Converter実装
   - reinhardt-web統合
   - Filter/Aggregation/Sort変換
   - エラーハンドリング
2. **Day 4-5**: Row-Level Security
   - SecurityEnforcer実装
   - ポリシーテスト
   - セキュリティ監査

### Week 6: Integration & API (Optional)
1. **Day 1-3**: API Endpoint実装
   - `/api/liquid/query` 作成
   - 認証・RLS統合
2. **Day 4-5**: E2E Testing
   - React (useLiquidView) ↔ Rust API統合
   - パフォーマンステスト
   - ドキュメント最終化

---

## Phase 2 完了基準

### 必須項目
- [ ] Rust Protocol: 全型定義完了、roundtrip テストパス
- [ ] Converter: DataSource → Query変換動作、95%+ カバレッジ
- [ ] RLS: SecurityEnforcer実装、100% カバレッジ
- [ ] 統合テスト: TypeScript + Rust 相互運用確認
- [ ] ドキュメント: cargo doc + API仕様書

### オプション項目
- [ ] API Endpoint実装
- [ ] E2E統合（React ↔ Rust）
- [ ] パフォーマンスベンチマーク

---

## Phase 2 → Phase 3 移行条件

Phase 2完了後、Phase 3（AI統合・Artifact永続化）に進む条件:
1. ✅ 全Rustテストパス（Converter + RLS）
2. ✅ TypeScript ↔ Rust 型一致性保証
3. ✅ セキュリティ監査完了
4. ✅ パフォーマンス要件達成（レイテンシ < 200ms）

---

## リスク管理

### リスク1: reinhardt-web API変更
- **対策**: Adapter パターンで抽象化
- **軽減**: モックQueryBuilder実装で依存性分離

### リスク2: Serde型不一致
- **対策**: 共通JSONフィクスチャで継続検証
- **軽減**: CI/CDで自動チェック

### リスク3: RLS漏れ
- **対策**: デフォルトDenyポリシー
- **軽減**: セキュリティ専門テストスイート

---

## 参考資料

- [Serde Documentation](https://serde.rs/)
- [reinhardt-web GitHub](https://github.com/kent8192/reinhardt-web)
- [CLAUDE.md](../CLAUDE.md) - 開発ガイド
- [Liquid Architecture Philosophy](../docs/Liquid Architecture Philosophy.md)

---

## 次のアクション

1. **Rust環境セットアップ確認**: `cargo --version` ≥ 1.70
2. **reinhardt-web サブモジュール初期化**: `git submodule update --init --recursive`
3. **Cargo workspace設定**: `Cargo.toml` 作成
4. **最初のテスト作成**: `crates/liquid-protocol/tests/roundtrip_test.rs`
5. **TDD開始**: Red-Green-Refactor

準備完了後、`cargo test` で開始！
