# Claude Code 開発ガイド

このドキュメントは、Claude CodeでProject Liquidを開発する際のコンテキストと実践的なガイドを提供します。

## プロジェクト理解

### アーキテクチャの核心

**3層Server-Driven UI**:
```
Frontend (Next.js/React)
  ↓ JSON Schema
Protocol (liquid-protocol)
  ↓ Validated Schema
Backend (reinhardt-web/Rust)
```

**重要な原則**:
1. **AIはJSONスキーマのみ出力** - 実行コード（JavaScript/SQL）は生成させない
2. **Rust型システムで厳格な検証** - 定義外フィールドは即座にエラー（Fail Fast）
3. **Row-Level Security強制** - ユーザー権限以上の情報を決して引き出せない

### ディレクトリ構造

```
liqueur/
├── packages/                    # TypeScript packages (npm workspaces)
│   ├── protocol/               # liquid-protocol (TypeScript)
│   │   ├── src/
│   │   │   ├── types/          # 🔴 index.ts: コア型定義
│   │   │   ├── validators/     # 🔴 schema.ts: バリデーター
│   │   │   └── schema/         # JSON Schema定義
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── react/                  # @liqueur/react
│   │   ├── src/
│   │   │   ├── components/     # 🔴 LiquidRenderer.tsx: JSON→React変換
│   │   │   │   ├── ChartComponent.tsx
│   │   │   │   └── TableComponent.tsx
│   │   │   ├── layouts/        # GridLayout, StackLayout
│   │   │   └── hooks/          # useLiquidView
│   │   └── tests/
│   │
│   └── playground/             # 開発用Next.jsアプリ
│       └── app/
│
├── crates/                     # Rust crates (Cargo workspace)
│   ├── liquid-protocol/        # liquid-protocol (Rust)
│   │   ├── src/
│   │   │   ├── schema.rs       # 🔴 Serde構造体定義
│   │   │   ├── validator.rs    # バリデーター実装
│   │   │   └── lib.rs
│   │   └── tests/
│   │
│   └── liquid-reinhardt/       # reinhardt-web adapter
│       ├── src/
│       │   ├── converter.rs    # 🔴 DataSource→reinhardt-db変換
│       │   ├── security.rs     # Row-Level Security
│       │   └── lib.rs
│       └── tests/
│
├── external/
│   └── reinhardt-web/          # Git submodule
│
└── docs/                       # ドキュメント
    ├── architecture/
    ├── development/
    └── api/
```

🔴 = Phase 1で最も重要なファイル

### 重要な概念

#### Artifact
- AI生成の永続的な構造化データ
- ClaudeのArtifact/GeminiのCanvasと同様
- ダッシュボード、レポートなどが各々Artifact
- **Artifactはコードではなく、意図の純粋な定義（JSON Schema）**

#### DataSource
- リソース（テーブル/モデル名）+ フィルタ + 集計 + ソート の抽象
- バックエンドでORMクエリに変換される
- 例:
  ```json
  {
    "resource": "expenses",
    "filters": [{"field": "category", "op": "neq", "value": "travel"}],
    "aggregation": {"type": "sum", "field": "amount", "by": "month"}
  }
  ```

#### Row-Level Security (RLS)
- ユーザー権限の強制
- CurrentUserコンテキストを必ずクエリに適用
- デフォルトポリシー: `WHERE user_id = current_user.id`
- カスタムポリシーで柔軟に制御可能

## 開発ワークフロー

### TDD手順（必須）

**Red-Green-Refactor Cycle**を厳格に守ります:

#### TypeScript TDD

```bash
cd packages/protocol
npm run test:watch

# 1. Red: 失敗するテストを作成
# tests/validator.test.ts に新しいテストケース追加
describe("SchemaValidator", () => {
  it("should reject invalid layout type", () => {
    const schema = { version: "1.0", layout: { type: "invalid", ... } };
    const result = validator.validate(schema);
    expect(result.valid).toBe(false);
  });
});

# 2. Green: 最小実装でテストをパス
# src/validators/schema.ts に実装
private validateLayout(layout: any, errors: ValidationError[]): void {
  const validTypes = ["grid", "stack", "flex"];
  if (!validTypes.includes(layout.type)) {
    errors.push(new ValidationError("INVALID_LAYOUT_TYPE", ...));
  }
}

# 3. Refactor: コード改善（テストは全てパス）

# 4. Coverage: 95%以上確認
npm run test -- --coverage
```

#### Rust TDD

```bash
cd crates/liquid-protocol
cargo watch -x test

# 1. Red: 失敗するテストを作成
#[test]
fn test_unsupported_version() {
    let schema = LiquidViewSchema { version: "2.0", ... };
    let validator = SchemaValidator::new();
    let result = validator.validate(&schema);
    assert!(result.is_err());
}

# 2. Green: 最小実装
pub fn validate(&self, schema: &LiquidViewSchema) -> Result<(), Vec<ValidationError>> {
    if !self.supported_versions.contains(&schema.version) {
        errors.push(ValidationError::UnsupportedVersion(...));
    }
    ...
}

# 3. Refactor: 改善

# 4. Coverage: 確認
cargo tarpaulin --out Html
```

### カバレッジ基準

| 指標 | 目標 | CI強制 |
|------|------|--------|
| 行カバレッジ | 95%以上 | ✅ ビルド失敗 |
| 分岐カバレッジ | 90%以上 | ✅ ビルド失敗 |
| 関数カバレッジ | 100% | ⚠️ 推奨 |

### TypeScript開発

**パッケージ**:
- `packages/protocol`: コアプロトコル定義、バリデーター
- `packages/react`: UIコンポーネントライブラリ

**テストツール**:
- Vitest: テストランナー
- React Testing Library: Reactコンポーネントテスト
- @vitest/coverage-v8: カバレッジ計測

**コマンド**:
```bash
npm run test:watch      # ウォッチモード
npm test -- --coverage  # カバレッジ確認
npm run typecheck       # 型チェック
npm run build           # ビルド
npm run docs            # TypeDoc生成
```

### Rust開発

**クレート**:
- `crates/liquid-protocol`: Serde構造体、バリデーター
- `crates/liquid-reinhardt`: reinhardt-webアダプター

**テストツール**:
- cargo test: テストランナー
- cargo tarpaulin: カバレッジ計測
- cargo watch: ホットリロード

**コマンド**:
```bash
cargo watch -x test            # ウォッチモード
cargo test --workspace         # 全テスト実行
cargo tarpaulin --out Html     # カバレッジ確認
cargo check --workspace        # 型チェック
cargo build --release          # リリースビルド
cargo doc --open               # ドキュメント生成
```

## 機能要件マッピング（構築忘れ防止）

| FR | 説明 | 実装箇所 | テストファイル | Week | Status |
|----|------|----------|--------------|------|--------|
| FR-01 | AI JSON生成 | (Phase 2対象) | - | - | ⏸️ Deferred |
| FR-02 | メタデータ提示 | (Phase 2対象) | - | - | ⏸️ Deferred |
| FR-03 | JSON限定出力 | (Phase 2対象) | - | - | ⏸️ Deferred |
| FR-04 | スキーマ検証（厳密型） | `packages/protocol/src/validators/schema.ts` | `tests/validator.test.ts` | Week 2 | ✅ Complete (96.76%) |
| FR-05 | Fail Fast | `packages/protocol/src/validators/schema.ts` | `tests/validator.test.ts` | Week 2 | ✅ Complete |
| FR-06 | DataSource→ORM変換 | `crates/liquid-reinhardt/src/converter.rs` | `tests/converter_test.rs` | Week 4 | ✅ Complete (95.7%) |
| FR-07 | Row-Level Security | `crates/liquid-reinhardt/src/security.rs` | `tests/security_test.rs` | Week 4 | ✅ Complete (100%) |
| FR-08 | UIレンダリング | `packages/react/src/components/LiquidRenderer.tsx` | `tests/LiquidRenderer.test.tsx` | Week 3 | ✅ Complete (98.68%) |
| FR-09 | ローディング状態 | `packages/react/src/components/ChartComponent.tsx` | `tests/ChartComponent.test.tsx` | Week 3 | ✅ Complete |
| FR-10 | スキーマ保存 | (Phase 3対象) | - | - | ⏸️ Deferred |
| FR-11 | スキーマロード | (Phase 3対象) | - | - | ⏸️ Deferred |

### 非機能要件チェックリスト

#### NFR-01: No Arbitrary Code Execution
- [ ] AIはJSON限定（FR-03, Phase 2）
- [x] バックエンド型検証（FR-04, Week 2） - `SchemaValidator`で厳密型チェック ✅
- [x] XSS防止（Week 3） - Reactの自動エスケープ活用 ✅
- [x] SQLインジェクション防止（Week 4） - ORMのみ使用、生SQLは禁止 ✅

#### NFR-02: Least Privilege
- [x] Row-Level Security（FR-07, Week 4） - `SecurityEnforcer`実装 ✅
- [x] CurrentUser強制（Week 4） - 全クエリにユーザーコンテキスト適用 ✅

#### NFR-03: パフォーマンス
- [ ] 静的ページ並みレイテンシ（Week 5で測定） - 保存済みスキーマのロードを最適化

#### NFR-04: 拡張性
- [x] プロトコル拡張のみで新コンポーネント追加可能（設計時点で保証） - Enumで型安全に拡張

#### NFR-05: 言語非依存
- [x] JSON Schema（Week 1-2で定義） - TypeScript/Rust間の契約書

## よくある開発タスク

### 新しいコンポーネント追加

**例: Calendarコンポーネントを追加**

1. **Protocol定義（TypeScript型）**
   ```typescript
   // packages/protocol/src/types/index.ts
   export interface CalendarComponent extends BaseComponent {
     type: "calendar";
     events_data_source?: string;
     view_mode?: "month" | "week" | "day";
   }

   export type Component = ChartComponent | TableComponent | CalendarComponent;
   ```

2. **Protocol定義（Rust Enum）**
   ```rust
   // crates/liquid-protocol/src/schema.rs
   #[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
   #[serde(tag = "type", rename_all = "snake_case")]
   pub enum Component {
       // ... existing variants
       Calendar {
           #[serde(skip_serializing_if = "Option::is_none")]
           events_data_source: Option<String>,
           #[serde(skip_serializing_if = "Option::is_none")]
           view_mode: Option<CalendarViewMode>,
       },
   }
   ```

3. **バリデーションロジック追加**
   ```typescript
   // packages/protocol/src/validators/schema.ts
   private validateComponent(component: any, errors: ValidationError[], path: string): void {
     const validTypes = ["chart", "table", "calendar"];  // 追加
     // ...

     if (component.type === "calendar") {
       const validViewModes = ["month", "week", "day"];
       if (component.view_mode && !validViewModes.includes(component.view_mode)) {
         errors.push(new ValidationError("INVALID_CALENDAR_VIEW_MODE", ...));
       }
     }
   }
   ```

4. **Reactコンポーネント実装**
   ```typescript
   // packages/react/src/components/CalendarComponent.tsx
   export const CalendarComponent: React.FC<CalendarComponentProps> = ({
     events_data_source,
     view_mode,
     data,
     loading
   }) => {
     // ... implementation with react-big-calendar or similar
   };
   ```

5. **LiquidRendererに統合**
   ```typescript
   // packages/react/src/components/LiquidRenderer.tsx
   const renderComponent = (component: Component, index: number) => {
     // ...
     switch (component.type) {
       // ... existing cases
       case "calendar":
         return <CalendarComponent {...component} data={componentData} />;
     }
   };
   ```

6. **テスト作成（全パターン）**
   ```typescript
   // packages/protocol/tests/validator.test.ts
   it("should validate calendar component", () => { ... });
   it("should reject invalid calendar view_mode", () => { ... });

   // packages/react/tests/CalendarComponent.test.tsx
   it("renders calendar with events", () => { ... });
   it("changes view mode", () => { ... });
   ```

### 新しいフィルタ演算子追加

**例: `between` 演算子を追加（数値範囲）**

1. **FilterOperator enumに追加**
   ```typescript
   // packages/protocol/src/types/index.ts
   export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains" | "between";
   ```

   ```rust
   // crates/liquid-protocol/src/schema.rs
   #[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
   #[serde(rename_all = "lowercase")]
   pub enum FilterOperator {
       // ... existing variants
       Between,
   }
   ```

2. **Converter変換ロジック実装**
   ```rust
   // crates/liquid-reinhardt/src/converter.rs
   fn convert_filter(&self, filter: &Filter) -> Result<Condition, ConversionError> {
       match (&filter.op, &filter.value) {
           // ... existing cases
           (FilterOperator::Between, FilterValue::Array(values)) => {
               if values.len() != 2 {
                   return Err(ConversionError::InvalidFilter(
                       "BETWEEN requires exactly 2 values".to_string()
                   ));
               }
               Ok(Condition::Between(filter.field.clone(), values[0], values[1]))
           }
           // ...
       }
   }
   ```

3. **バリデーションテスト追加**
   ```typescript
   // packages/protocol/tests/validator.test.ts
   it("should validate between operator with array value", () => {
     const schema = {
       // ...
       filters: [{ field: "age", op: "between", value: [18, 65] }]
     };
     expect(validator.validate(schema).valid).toBe(true);
   });

   it("should reject between operator with non-array value", () => {
     const schema = {
       // ...
       filters: [{ field: "age", op: "between", value: 18 }]
     };
     expect(validator.validate(schema).valid).toBe(false);
   });
   ```

4. **統合テスト実行**
   ```bash
   # TypeScript
   cd packages/protocol && npm test -- --coverage

   # Rust
   cd crates/liquid-reinhardt && cargo test
   ```

### DataSource複雑クエリ例

**例: 旅費を除いた月別経費の合計（降順、上位10件）**

```json
{
  "ds_top_expenses": {
    "resource": "expenses",
    "filters": [
      { "field": "category", "op": "neq", "value": "travel" },
      { "field": "amount", "op": "gt", "value": 0 }
    ],
    "aggregation": {
      "type": "sum",
      "field": "amount",
      "by": "month"
    },
    "sort": {
      "field": "amount_sum",
      "direction": "desc"
    },
    "limit": 10
  }
}
```

**Rust変換結果（イメージ）**:
```rust
SELECT
  month,
  SUM(amount) as amount_sum
FROM expenses
WHERE
  category != 'travel' AND
  amount > 0 AND
  user_id = $current_user_id  -- Row-Level Security
GROUP BY month
ORDER BY amount_sum DESC
LIMIT 10
```

## トラブルシューティング

### TypeScript/Rust型の不一致

**症状**: TypeScriptでは有効なJSONがRustでデシリアライズ失敗

**原因**: Serde構造体定義とTypeScript型定義の不整合

**解決策**:
1. JSON SchemaでRoundtrip テスト実行
   ```rust
   #[test]
   fn test_serde_roundtrip() {
       let schema = LiquidViewSchema { ... };
       let json = serde_json::to_string(&schema).unwrap();
       let deserialized: LiquidViewSchema = serde_json::from_str(&json).unwrap();
       assert_eq!(schema, deserialized);
   }
   ```

2. TypeScript型定義を確認
   ```typescript
   const schema: LiquidViewSchema = { ... };
   const result = validator.validate(schema);
   ```

3. 両言語で同じJSONをテスト
   ```bash
   # TypeScript
   echo '{"version":"1.0",...}' | npm run validate

   # Rust
   echo '{"version":"1.0",...}' | cargo run --example validate
   ```

### テストカバレッジ不足

**症状**: CIでカバレッジ95%未満でビルド失敗

**原因**: 新しいコードパスのテストが不足

**解決策**:
1. カバレッジレポート確認
   ```bash
   # TypeScript
   npm test -- --coverage
   open coverage/index.html

   # Rust
   cargo tarpaulin --out Html
   open tarpaulin-report.html
   ```

2. カバーされていない行を特定し、テストケース追加

3. エッジケースを網羅
   - 空配列
   - null/undefined
   - 境界値（0, -1, MAX_INT）
   - 不正な型

### reinhardt-web統合エラー

**症状**: `reinhardt-web`のAPI呼び出しでコンパイルエラー

**原因**: submoduleのバージョン不整合、API変更

**解決策**:
1. submoduleを最新に更新
   ```bash
   git submodule update --remote --merge
   ```

2. Adapterパターンで疎結合化
   ```rust
   // trait定義で抽象化
   pub trait QueryBuilder {
       fn where_clause(self, condition: Condition) -> Self;
       fn execute(&self) -> Result<Vec<Row>>;
   }

   // reinhardt-web実装
   impl QueryBuilder for ReinhardtQueryBuilder {
       // ...
   }
   ```

3. モックで単体テスト
   ```rust
   #[cfg(test)]
   mod tests {
       struct MockQueryBuilder;
       impl QueryBuilder for MockQueryBuilder { ... }
   }
   ```

## 参考資料

### プロジェクト内ドキュメント
- [Liquid Architecture Philosophy](docs/Liquid Architecture Philosophy.md) - アーキテクチャ哲学
- [Layer Requirements](docs/Liquid Layer Requirements.md) - 機能/非機能要件
- [Project Proposal](docs/Project Liquid Proposal.md) - プロジェクト概要

### 外部リソース
- [reinhardt-web GitHub](https://github.com/kent8192/reinhardt-web)
- [Serde Documentation](https://serde.rs/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)

## 開発時の注意事項

### TDD厳守
- **必ず**テストを先に書く（Red-Green-Refactor）
- カバレッジ95%未満は受け入れ不可
- CIパスしない限りマージ禁止

### ドキュメント更新
- コード変更時は対応するドキュメントも更新
- API変更時はこのファイルの機能要件マッピングも更新
- TypeDoc/cargo docコメントを充実

### セキュリティ
- AI出力は常にバリデーション
- ユーザー権限を必ず確認（CurrentUser強制）
- SQLインジェクション/XSSに常に注意
- 生SQLは絶対に使用しない（ORMのみ）

### コードレビュー
- 全PRに詳細な説明
- テストカバレッジ証明（スクリーンショット）
- ドキュメント更新確認
- セキュリティチェックリスト確認

---

このドキュメントは実装の進行に伴って継続的に更新されます。
質問や提案があれば、Issueを作成してください。
