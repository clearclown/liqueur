# Project Liquid Phase 2 実装計画

**作成日**: 2026-01-17
**Phase**: Phase 2 - AI Integration & Schema Generation
**ステータス**: 🚧 進行中

---

## Phase 2 目標

### 機能要件
- **FR-01**: AI JSON生成 - AIプロバイダー統合、プロンプト→スキーマ変換
- **FR-02**: メタデータ提示 - DatabaseMetadata動的生成
- **FR-03**: JSON限定出力 - AI出力の厳密検証

### 非機能要件
- **NFR-01**: No Arbitrary Code Execution - AIはJSON限定
- **NFR-03**: パフォーマンス - レスポンスタイム < 3秒
- **NFR-04**: 拡張性 - 複数AIプロバイダー対応

### 品質目標
- テストカバレッジ **95%以上**
- 全テストpass率 **100%**
- TDD厳守 (Red-Green-Refactor)

---

## 実装ロードマップ

### Week 1: AI Provider基盤実装

#### Task 1.1: Anthropic Claude Provider実装
**TDD手順**:
1. **Red**: `tests/providers/AnthropicProvider.test.ts` 作成
   - API接続テスト (モック)
   - スキーマ生成テスト
   - エラーハンドリングテスト
   - レート制限テスト

2. **Green**: `src/providers/AnthropicProvider.ts` 実装
   - `@anthropic-ai/sdk` 統合
   - `generateSchema()` 実装
   - トークン使用量計測
   - コスト計算

3. **Refactor**: コード最適化
   - プロンプト最適化
   - エラーメッセージ改善

**受け入れ基準**:
- [ ] 95%+ テストカバレッジ
- [ ] モックテスト全pass
- [ ] 実際のAPI呼び出しで有効なスキーマ生成確認

#### Task 1.2: Google Gemini Provider実装
**TDD手順**:
1. **Red**: `tests/providers/GeminiProvider.test.ts` 作成
2. **Green**: `src/providers/GeminiProvider.ts` 実装
3. **Refactor**: コード最適化

**受け入れ基準**:
- [ ] 95%+ テストカバレッジ
- [ ] Anthropicと同等の機能

#### Task 1.3: Provider Factory拡張
**TDD手順**:
1. **Red**: `tests/factory/ProviderFactory.test.ts` 更新
   - 実プロバイダー選択テスト
   - フォールバックテスト
   - 設定検証テスト

2. **Green**: `src/factory/ProviderFactory.ts` 実装
   - 環境変数からプロバイダー選択
   - API Key検証
   - フォールバック実装

3. **Refactor**: エラーハンドリング強化

**受け入れ基準**:
- [ ] 全プロバイダー切り替え可能
- [ ] 設定エラー時の明確なエラーメッセージ

---

### Week 2: DatabaseMetadata実装

#### Task 2.1: Metadata型定義の拡張
**ファイル**: `packages/ai-provider/src/types/index.ts`

**既存の型**:
```typescript
export interface DatabaseMetadata {
  tables: TableMetadata[];
}

export interface TableMetadata {
  name: string;
  description?: string;
  columns: ColumnMetadata[];
  rowCount?: number;
  sampleData?: unknown[];
}
```

**追加する型** (必要に応じて):
```typescript
export interface RelationshipMetadata {
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}
```

#### Task 2.2: Metadata動的生成実装
**TDD手順**:
1. **Red**: `tests/services/MetadataService.test.ts` 作成
   - モックDB接続
   - スキーマ探索テスト
   - サンプルデータ取得テスト

2. **Green**: `packages/playground/lib/services/MetadataService.ts` 実装
   - DB接続 (Prisma/Drizzle等)
   - `INFORMATION_SCHEMA` クエリ
   - サンプルデータ取得

3. **Refactor**: パフォーマンス最適化

**受け入れ基準**:
- [ ] 実際のDBから正しいメタデータ取得
- [ ] < 1秒でメタデータ生成
- [ ] 95%+ テストカバレッジ

#### Task 2.3: Metadata API実装
**エンドポイント**: `GET /api/liquid/metadata`

**TDD手順**:
1. **Red**: `tests/api-metadata.test.ts` 作成
2. **Green**: `app/api/liquid/metadata/route.ts` 実装
3. **Refactor**: キャッシング追加

**受け入れ基準**:
- [ ] 正しいJSONレスポンス
- [ ] エラーハンドリング完備
- [ ] キャッシング実装

---

### Week 3: Generate API完全実装

#### Task 3.1: Generate API実装
**エンドポイント**: `POST /api/liquid/generate`

**TDD手順**:
1. **Red**: `tests/api-generate.test.ts` 作成
   - 有効なプロンプトテスト
   - 無効なプロンプトテスト
   - メタデータなしテスト
   - レート制限テスト

2. **Green**: `app/api/liquid/generate/route.ts` 実装
   - 実AIプロバイダー統合
   - プロンプト検証
   - スキーマ検証 (SchemaValidator)
   - エラーハンドリング

3. **Refactor**: レスポンスタイム最適化

**受け入れ基準**:
- [ ] 実際のAI呼び出しで有効なスキーマ生成
- [ ] < 3秒でレスポンス
- [ ] 95%+ テストカバレッジ
- [ ] 無効なスキーマは即座に拒否

#### Task 3.2: プロンプトエンジニアリング
**ファイル**: `packages/ai-provider/src/prompts/dashboardPrompt.ts`

**最適化項目**:
1. システムプロンプト改善
   - Liquid Protocol仕様の明確化
   - 例示の追加
   - 制約の明確化

2. Few-shot examples追加
   - 良いスキーマ例
   - 悪いスキーマ例とその理由

3. メタデータ活用
   - テーブル/カラム情報の最大活用
   - リレーション情報の活用

**受け入れ基準**:
- [ ] 生成成功率 > 90%
- [ ] 有効なスキーマ率 > 95%
- [ ] ユーザー意図との一致率 > 85%

---

### Week 4: コスト追跡システム

#### Task 4.1: Cost Tracking Service実装
**TDD手順**:
1. **Red**: `tests/services/CostTracker.test.ts` 作成
   - トークン計測テスト
   - コスト計算テスト
   - 集計テスト

2. **Green**: `packages/ai-provider/src/services/CostTracker.ts` 実装
   - トークン使用量記録
   - プロバイダー別コスト計算
   - 日次/月次集計

3. **Refactor**: ストレージ最適化

**受け入れ基準**:
- [ ] 正確なトークン計測
- [ ] 正確なコスト計算
- [ ] 95%+ テストカバレッジ

#### Task 4.2: Cost Dashboard実装
**ページ**: `/app/costs/page.tsx`

**機能**:
- リアルタイムコスト表示
- プロバイダー別内訳
- 月次トレンドグラフ
- アラート設定

**受け入れ基準**:
- [ ] リアルタイム更新
- [ ] レスポンシブデザイン
- [ ] Recharts統合

---

### Week 5: 統合テストとE2E

#### Task 5.1: Integration Tests
**テストシナリオ**:
1. **エンドツーエンドAI生成**
   - プロンプト入力 → AI生成 → スキーマ検証 → Artifact保存
   - エラー時のロールバック

2. **複数プロバイダー切り替え**
   - Anthropic → Gemini
   - フォールバック動作

3. **コスト追跡統合**
   - 生成 → コスト記録 → ダッシュボード反映

**受け入れ基準**:
- [ ] 全シナリオpass
- [ ] エラー時の適切なハンドリング

#### Task 5.2: E2E Tests (Playwright)
**テストケース**:
1. **TC-E2E-01**: AI生成フロー
   - プロンプト入力 → 生成 → プレビュー → 保存

2. **TC-E2E-02**: エラーハンドリング
   - 無効なプロンプト → エラー表示
   - API障害 → 適切なエラーメッセージ

3. **TC-E2E-03**: コスト表示
   - 生成実行 → コスト記録 → ダッシュボード確認

**受け入れ基準**:
- [ ] 3ブラウザ × 全テストpass
- [ ] スクリーンショット差分なし

---

## テストカバレッジ目標

| パッケージ | 目標 | 現状 | Gap |
|-----------|------|------|-----|
| ai-provider (providers) | 95% | 0% | +95% |
| ai-provider (services) | 95% | 0% | +95% |
| playground (generate API) | 95% | 0% | +95% |
| playground (metadata API) | 95% | - | +95% |

---

## セキュリティチェックリスト

### API Key管理
- [ ] 環境変数のみ使用
- [ ] `.env.example` 提供
- [ ] API Keyのログ出力禁止
- [ ] クライアント側へのAPI Key漏洩防止

### AI出力検証
- [ ] SchemaValidator厳密検証
- [ ] 不正なフィールド即座拒否
- [ ] SQL/JavaScript注入不可能性確認

### レート制限
- [ ] プロバイダー別レート制限実装
- [ ] ユーザー別レート制限実装
- [ ] 429エラー適切ハンドリング

---

## パフォーマンス目標

| 項目 | 目標 | 測定方法 |
|------|------|---------|
| AI生成レスポンス | < 3秒 | Playwrightタイミング |
| Metadata生成 | < 1秒 | APIテスト |
| コスト計算 | < 100ms | ユニットテスト |

---

## ドキュメント作成

### 必須ドキュメント
1. **API Reference**
   - `POST /api/liquid/generate`
   - `GET /api/liquid/metadata`
   - リクエスト/レスポンス例

2. **AI Provider Guide**
   - プロバイダー追加方法
   - API Key設定方法
   - トラブルシューティング

3. **Prompt Engineering Guide**
   - 効果的なプロンプト書き方
   - メタデータの活用方法
   - ベストプラクティス

4. **Cost Management Guide**
   - コスト計算方法
   - 最適化Tips
   - アラート設定方法

---

## Phase 2完了条件

### 必須条件
- [ ] 全機能要件実装 (FR-01, FR-02, FR-03)
- [ ] 全テスト pass (100%)
- [ ] テストカバレッジ **95%以上**
- [ ] 全パッケージビルド成功
- [ ] E2Eテスト全pass

### 品質条件
- [ ] TDD厳守証明
- [ ] コードレビュー完了
- [ ] ドキュメント完備
- [ ] セキュリティチェック完了

### パフォーマンス条件
- [ ] AI生成 < 3秒
- [ ] Metadata生成 < 1秒
- [ ] コスト計算 < 100ms

---

## リスクと対策

### リスク1: AI API障害
**影響**: サービス停止
**対策**:
- 複数プロバイダー対応
- フォールバック実装
- キャッシング戦略

### リスク2: コスト超過
**影響**: 予算オーバー
**対策**:
- レート制限実装
- アラート設定
- ユーザー別上限設定

### リスク3: 生成品質不安定
**影響**: ユーザー体験低下
**対策**:
- プロンプトエンジニアリング最適化
- Few-shot examples追加
- フィードバックループ実装

---

**作成者**: Claude Sonnet 4.5
**承認**: Phase 2実装開始承認待ち
