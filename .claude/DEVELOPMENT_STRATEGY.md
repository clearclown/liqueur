# Project Liquid 開発戦略
**作成日**: 2026-01-15
**Ralph Loop Iteration**: 1

## 厳密なSpec開発・GitHub Worktree・TDDによる絶対的品質管理

### 開発原則

#### 1. 厳密なSpec開発
- **仕様書駆動**: 機能要件（FR）と非機能要件（NFR）を明確に定義
- **トレーサビリティ**: 各実装がどのFRに対応するかを常に追跡
- **検収基準**: 各FRに対して具体的な受け入れテストを定義

#### 2. GitHub Worktree戦略
```
liqueur/                          # main worktree
liqueur-worktrees/
  ├── feat-react-ui/             # FR-08, FR-09
  ├── feat-reinhardt-converter/  # FR-06
  └── feat-rls-security/         # FR-07
```

**ブランチ命名規則**:
- `feat/<fr-id>-<short-description>`: 機能実装
- `test/<fr-id>-<test-type>`: テストファイル専用
- `refactor/<component>`: リファクタリング

#### 3. TDD絶対主義
```
Red → Green → Refactor → Coverage Check (95%+) → Commit
```

**品質ゲート**:
1. ✅ テストが先に書かれているか？
2. ✅ カバレッジ95%以上か？
3. ✅ すべてのテストがパスしているか？
4. ✅ 型チェックが通っているか？
5. ✅ リントエラーがないか？

### 機能要件実装計画

#### Phase 1: React UI層（FR-08, FR-09）- Week 3相当

**目標**: JSON SchemaをReactコンポーネントにレンダリング

**Worktree**: `feat-react-ui`

**実装順序（TDD）**:

1. **LiquidRenderer基本構造**
   ```typescript
   // Test First
   describe('LiquidRenderer', () => {
     it('should render grid layout with 2 columns', ...)
     it('should throw error for invalid schema', ...)
   })

   // Then Implementation
   export const LiquidRenderer: FC<Props> = ({ schema }) => { ... }
   ```

2. **ChartComponent**
   ```typescript
   // Test First
   describe('ChartComponent', () => {
     it('should render bar chart with recharts', ...)
     it('should show loading state', ...)  // FR-09
     it('should handle empty data gracefully', ...)
   })
   ```

3. **TableComponent**
   ```typescript
   // Test First
   describe('TableComponent', () => {
     it('should render table with columns', ...)
     it('should sort by column', ...)
   })
   ```

4. **GridLayout & StackLayout**
   ```typescript
   // Test First
   describe('GridLayout', () => {
     it('should arrange components in grid', ...)
     it('should be responsive', ...)
   })
   ```

**検収基準**:
- [ ] カバレッジ95%以上
- [ ] Storybookでビジュアル確認可能
- [ ] 型安全（no `any`）
- [ ] アクセシビリティAA準拠

#### Phase 2: Reinhardt統合層（FR-06, FR-07）- Week 4相当

**目標**: DataSource→ORM変換とRow-Level Security

**Worktree**: `feat-reinhardt-converter`（FR-06）, `feat-rls-security`（FR-07）

**実装順序（TDD）**:

1. **DataSource Converter（FR-06）**
   ```rust
   // Test First
   #[test]
   fn test_convert_simple_filter() {
       let ds = DataSource {
           resource: "users".to_string(),
           filters: vec![Filter { field: "age", op: Gt, value: 18 }]
       };
       let query = converter.convert(&ds).unwrap();
       assert_eq!(query.where_clause(), "age > 18");
   }

   // Then Implementation
   pub struct DataSourceConverter { ... }
   impl DataSourceConverter {
       pub fn convert(&self, ds: &DataSource) -> Result<Query, ConversionError> { ... }
   }
   ```

2. **Row-Level Security Enforcer（FR-07）**
   ```rust
   // Test First
   #[test]
   fn test_rls_enforces_user_context() {
       let ctx = CurrentUser { id: 123 };
       let query = Query::new("SELECT * FROM expenses");
       let enforced = rls.enforce(query, &ctx).unwrap();
       assert!(enforced.where_clause().contains("user_id = 123"));
   }

   // Then Implementation
   pub struct SecurityEnforcer { ... }
   impl SecurityEnforcer {
       pub fn enforce(&self, query: Query, ctx: &CurrentUser) -> Result<Query> { ... }
   }
   ```

**検収基準**:
- [ ] カバレッジ96%以上（Rust標準）
- [ ] reinhardt-web統合テストパス
- [ ] SQLインジェクション耐性テスト
- [ ] パフォーマンスベンチマーク（1000クエリ/秒）

### Worktree運用ワークフロー

#### 新機能開発の手順

```bash
# 1. Worktreeブランチ作成
git worktree add -b feat-react-ui ../liqueur-worktrees/feat-react-ui main

# 2. Worktreeに移動して開発
cd ../liqueur-worktrees/feat-react-ui

# 3. TDD Cycle（Red）
vim packages/react/tests/LiquidRenderer.test.tsx
npm test  # 失敗を確認

# 4. TDD Cycle（Green）
vim packages/react/src/components/LiquidRenderer.tsx
npm test  # パスを確認

# 5. TDD Cycle（Refactor）
# コード改善

# 6. カバレッジ確認
npm test -- --coverage
# 95%未満なら追加テスト

# 7. 品質ゲートチェック
npm run typecheck
npm run lint

# 8. コミット（Conventional Commits）
git add .
git commit -m "feat(react): implement LiquidRenderer core (FR-08)

- Add LiquidRenderer component with grid/stack layout support
- Implement loading state handling (FR-09)
- Test coverage: 97.3%

Closes #123"

# 9. メインリポジトリに戻ってマージ検討
cd /home/ablaze/Projects/liqueur
git merge --no-ff feat-react-ui

# 10. Worktree削除（マージ後）
git worktree remove ../liqueur-worktrees/feat-react-ui
```

#### コミットメッセージ規約

```
<type>(<scope>): <subject> (FR-XX)

<body>

<footer>
```

**Type**:
- `feat`: 新機能
- `fix`: バグ修正
- `test`: テスト追加・修正
- `refactor`: リファクタリング
- `docs`: ドキュメント
- `chore`: ビルド・設定

**Scope**:
- `protocol`: liquid-protocol（TS/Rust）
- `react`: @liqueur/react
- `reinhardt`: liquid-reinhardt
- `ci`: CI/CD

**Subject**: 50文字以内、命令形

**Body**: 変更の理由、影響範囲、テストカバレッジ

**Footer**: `Closes #issue-number`, `BREAKING CHANGE`

### CI/CD品質ゲート

#### GitHub Actions設定（`.github/workflows/quality-gate.yml`）

```yaml
name: Quality Gate

on: [push, pull_request]

jobs:
  typescript-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --coverage
      - name: Check coverage threshold
        run: |
          if [ $(jq '.total.lines.pct < 95' coverage/coverage-summary.json) ]; then
            echo "Coverage below 95%"
            exit 1
          fi

  rust-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: cargo test --workspace
      - run: cargo tarpaulin --out Xml
      - name: Check coverage threshold
        run: |
          if [ $(grep -oP 'line-rate="\K[0-9.]+' cobertura.xml | awk '{if ($1 < 0.95) exit 1}') ]; then
            echo "Coverage below 95%"
            exit 1
          fi

  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
      - run: cargo audit
```

### 現在のステータス

#### ✅ 完了
- FR-04, FR-05: スキーマ検証（TS: 96.76%, Rust: 96.97%）
- Protocol型定義（TypeScript/Rust完全互換）

#### 🔨 実装待ち
- FR-08, FR-09: React UI層
- FR-06: DataSource Converter
- FR-07: Row-Level Security

#### ⏸️ Phase 2以降
- FR-01, FR-02, FR-03: AI統合
- FR-10, FR-11: 永続化

### 次のアクション（Iteration 1）

1. **FR-08実装開始**: React UI基盤
   - Worktree作成: `feat-react-ui`
   - LiquidRendererテスト作成（Red）
   - 実装（Green）
   - カバレッジ95%達成

2. **CI/CD設定**: 品質ゲート自動化
   - GitHub Actions設定
   - カバレッジ閾値強制

3. **ドキュメント更新**: CLAUDE.mdのステータス更新

---

**Completion Criteria（Ralph Loop Exit）**:
- [ ] FR-08, FR-09完全実装（React UI）
- [ ] FR-06, FR-07完全実装（Reinhardt統合）
- [ ] すべてのテストカバレッジ95%以上
- [ ] CI/CDパイプライン稼働
- [ ] ドキュメント完全同期
