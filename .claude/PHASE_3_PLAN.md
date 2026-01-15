# Phase 3 実装計画 - AI統合とArtifact永続化

## Phase 3 概要

**目的**: AI駆動のLiquidViewスキーマ生成とArtifact永続化により、エンドツーエンドの動的UI生成を実現

**期間**: Week 7-10（予定）

**前提条件**: Phase 1-2完了
- ✅ TypeScript Protocol + React UI (98 tests)
- ✅ Rust Protocol + Converter + RLS (65 tests)
- ✅ Total: 163/163 tests passing

---

## Phase 3 スコープ

### 実装対象

#### 1. AI Provider Abstraction (FR-01, FR-03の基盤)
**パッケージ**: 新規 `packages/ai-provider`

**サポートプロバイダー**:
- **OpenAI API** (Claude Haiku via Anthropic API)
- **Google Gemini API** (Gemini Flash)
- **DeepSeek AI API**
- **Local LLM** (LM Studio via OpenAI-compatible endpoint)

**タスク**:
- [ ] Provider抽象化インターフェース定義
  ```typescript
  interface AIProvider {
    generateSchema(prompt: string, metadata: DatabaseMetadata): Promise<LiquidViewSchema>;
    validateResponse(response: unknown): ValidationResult;
    estimateCost(prompt: string): number;
  }
  ```
- [ ] 各プロバイダー実装
  - `AnthropicProvider` (Claude Haiku)
  - `GeminiProvider` (Gemini Flash)
  - `DeepSeekProvider`
  - `LocalLLMProvider` (LM Studio)
- [ ] Retry/Fallback戦略
- [ ] レート制限管理
- [ ] コスト追跡
- [ ] テスト (モックプロバイダー)

**成果物**:
- `packages/ai-provider/src/providers/*.ts`
- `packages/ai-provider/tests/*.test.ts`

---

#### 2. LiquidView Schema Generation (FR-01, FR-02, FR-03)
**パッケージ**: 新規 `packages/schema-generator`

**機能要件**:
- **FR-01**: AI JSON生成
  - ユーザープロンプト → LiquidViewSchema
  - データベースメタデータ利用
  - コンポーネント自動選択（Chart/Table）
  - DataSource自動構築
- **FR-02**: メタデータ提示
  - 利用可能なテーブル/カラム情報提供
  - サンプルデータ提示
  - 集計可能フィールド推奨
- **FR-03**: JSON限定出力
  - 生コード生成禁止
  - スキーマバリデーション強制
  - サニタイゼーション

**タスク**:
- [ ] プロンプトエンジニアリング
  - System prompt設計（JSON限定出力）
  - Few-shot examples準備
  - メタデータフォーマット定義
- [ ] スキーマ生成パイプライン
  ```typescript
  class SchemaGenerator {
    async generate(userPrompt: string, dbMetadata: DatabaseMetadata): Promise<LiquidViewSchema> {
      const systemPrompt = this.buildSystemPrompt(dbMetadata);
      const aiResponse = await this.provider.generateSchema(userPrompt, dbMetadata);
      const validated = this.validator.validate(aiResponse);
      if (!validated.valid) throw new ValidationError(validated.errors);
      return aiResponse;
    }
  }
  ```
- [ ] エラーハンドリング
  - 不正JSON検出
  - スキーマ修復試行
  - ユーザーフィードバック
- [ ] テスト (統合テスト含む)

**成果物**:
- `packages/schema-generator/src/generator.ts`
- `packages/schema-generator/src/prompts/*.ts`
- `packages/schema-generator/tests/*.test.ts`

---

#### 3. Database Metadata Extraction (FR-02)
**パッケージ**: 新規 `packages/db-metadata` または `crates/liquid-reinhardt`拡張

**タスク**:
- [ ] メタデータ抽出API
  ```typescript
  interface DatabaseMetadata {
    tables: Array<{
      name: string;
      columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
        isPrimaryKey: boolean;
        isForeignKey: boolean;
      }>;
      rowCount: number;
      sampleData?: unknown[];
    }>;
  }
  ```
- [ ] reinhardt-web統合
  - INFORMATION_SCHEMA クエリ
  - サンプルデータ取得（limit 5）
  - 型推論（文字列→数値集計可能か）
- [ ] キャッシング戦略
- [ ] セキュリティ（メタデータもRLS適用）

**成果物**:
- `packages/db-metadata/src/extractor.ts`
- `crates/liquid-reinhardt/src/metadata.rs` (Rust側実装)

---

#### 4. Artifact Persistence (FR-10, FR-11)
**パッケージ**: 新規 `packages/artifact-store` + `crates/liquid-artifacts`

**機能要件**:
- **FR-10**: スキーマ保存
  - Artifact CRUD操作
  - バージョニング（履歴管理）
  - タグ/カテゴリ分類
- **FR-11**: スキーマロード
  - ID/Slug検索
  - ユーザー別一覧
  - 共有設定（Private/Public/Team）

**データモデル**:
```typescript
interface Artifact {
  id: string;
  userId: string;
  title: string;
  description?: string;
  schema: LiquidViewSchema;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  visibility: 'private' | 'public' | 'team';
}
```

**タスク**:
- [ ] データベーススキーマ設計
  ```sql
  CREATE TABLE artifacts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    schema JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    tags TEXT[],
    visibility TEXT DEFAULT 'private'
  );

  CREATE INDEX idx_artifacts_user_id ON artifacts(user_id);
  CREATE INDEX idx_artifacts_tags ON artifacts USING GIN(tags);
  ```
- [ ] Repository実装（Rust）
  ```rust
  pub trait ArtifactRepository {
      async fn create(&self, artifact: &Artifact) -> Result<Artifact>;
      async fn get(&self, id: &Uuid) -> Result<Option<Artifact>>;
      async fn list_by_user(&self, user_id: &Uuid) -> Result<Vec<Artifact>>;
      async fn update(&self, artifact: &Artifact) -> Result<Artifact>;
      async fn delete(&self, id: &Uuid) -> Result<()>;
  }
  ```
- [ ] API Endpoint実装
  - `POST /api/artifacts` - 作成
  - `GET /api/artifacts/:id` - 取得
  - `GET /api/artifacts` - 一覧（ユーザー別）
  - `PUT /api/artifacts/:id` - 更新
  - `DELETE /api/artifacts/:id` - 削除
- [ ] Row-Level Security適用
- [ ] バージョニングロジック
- [ ] テスト (CRUD + RLS)

**成果物**:
- `crates/liquid-artifacts/src/repository.rs`
- `packages/artifact-store/src/client.ts` (TypeScript API client)
- マイグレーションSQL

---

## 実装アーキテクチャ

### AI生成フロー

```
User Prompt
    ↓
Database Metadata Extraction (reinhardt-web)
    ↓
AI Provider (Claude/Gemini/DeepSeek/Local)
    ↓ System Prompt + Few-shot Examples + Metadata
LiquidViewSchema (JSON)
    ↓
Schema Validator (TypeScript + Rust)
    ↓ (Valid)
Artifact Store (PostgreSQL)
    ↓
useLiquidView Hook (Data Fetching)
    ↓
LiquidRenderer (React UI)
```

---

## .env設定

### 環境変数

```bash
# AI Provider選択 (anthropic | gemini | deepseek | local)
AI_PROVIDER=anthropic

# Anthropic API (Claude Haiku)
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_MODEL=claude-3-haiku-20240307

# Google Gemini API
GOOGLE_API_KEY=AIzaSyxxx
GEMINI_MODEL=gemini-1.5-flash

# DeepSeek AI API
DEEPSEEK_API_KEY=sk-xxx
DEEPSEEK_MODEL=deepseek-chat

# Local LLM (LM Studio)
LOCAL_LLM_BASE_URL=http://localhost:1234/v1
LOCAL_LLM_MODEL=local-model

# Database Connection (reinhardt-web)
DATABASE_URL=postgresql://user:pass@localhost:5432/liqueur

# Artifact Storage
ARTIFACT_TABLE=artifacts

# Security
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# Rate Limiting
AI_REQUEST_LIMIT_PER_MINUTE=10
AI_REQUEST_LIMIT_PER_HOUR=100

# Cost Tracking
ENABLE_COST_TRACKING=true
COST_ALERT_THRESHOLD=10.00
```

---

## プロンプトエンジニアリング戦略

### System Prompt (JSON限定出力)

```markdown
You are a LiquidView schema generator. Your ONLY output is valid JSON conforming to the LiquidViewSchema specification.

RULES:
1. OUTPUT ONLY JSON - No code, no explanations, no markdown
2. VALIDATE against protocol v1.0
3. USE ONLY provided database metadata
4. NEVER generate SQL, JavaScript, or executable code
5. ONLY use: chart (bar/line/pie/area), table components
6. APPLY filters/aggregations through DataSource (no client-side logic)

DATABASE METADATA:
{metadata}

SCHEMA SPECIFICATION:
{
  "version": "1.0",
  "layout": { "type": "grid" | "stack", ... },
  "components": [ { "type": "chart" | "table", ... } ],
  "data_sources": { "name": { "resource": "table_name", ... } }
}

OUTPUT VALID JSON ONLY.
```

### Few-shot Examples

```json
[
  {
    "user_prompt": "Show me monthly sales for 2024",
    "metadata": {
      "tables": [
        {
          "name": "sales",
          "columns": [
            { "name": "month", "type": "text" },
            { "name": "amount", "type": "numeric" },
            { "name": "year", "type": "integer" }
          ]
        }
      ]
    },
    "output": {
      "version": "1.0",
      "layout": { "type": "grid", "columns": 1 },
      "components": [
        {
          "type": "chart",
          "variant": "bar",
          "title": "Monthly Sales 2024",
          "data_source": "ds_sales",
          "xAxis": "month",
          "yAxis": "amount"
        }
      ],
      "data_sources": {
        "ds_sales": {
          "resource": "sales",
          "filters": [{ "field": "year", "op": "eq", "value": 2024 }],
          "sort": { "field": "month", "direction": "asc" }
        }
      }
    }
  }
]
```

---

## Phase 3 実装順序

### Week 7: AI Provider Foundation
1. **Day 1-2**: Provider抽象化
   - インターフェース定義
   - モックプロバイダー実装
   - テストスイート構築
2. **Day 3-4**: 実Providerフ実装
   - AnthropicProvider (Claude Haiku)
   - GeminiProvider (Gemini Flash)
3. **Day 5**: DeepSeek + Local LLM
   - DeepSeekProvider
   - LocalLLMProvider (LM Studio)

### Week 8: Schema Generation & Metadata
1. **Day 1-2**: Metadata Extraction
   - Database introspection実装
   - サンプルデータ取得
   - キャッシング
2. **Day 3-5**: Schema Generator
   - プロンプト設計
   - Few-shot examples
   - 生成パイプライン実装
   - 統合テスト

### Week 9: Artifact Persistence
1. **Day 1-2**: Database Schema
   - マイグレーション作成
   - Repository実装（Rust）
2. **Day 3-4**: API Endpoints
   - CRUD endpoints実装
   - RLS適用
   - バージョニング
3. **Day 5**: TypeScript Client
   - API client実装
   - React Hooks (useArtifacts)

### Week 10: Integration & Polish
1. **Day 1-3**: E2E Integration
   - React UI → AI Generator → Artifact Store
   - エラーハンドリング強化
   - ユーザーフィードバック
2. **Day 4-5**: Documentation & Demo
   - API documentation
   - Usage examples
   - Demo動画/GIF

---

## Phase 3 完了基準

### 必須項目
- [ ] AI Provider: 4プロバイダー実装、切り替え可能
- [ ] Schema Generator: ユーザープロンプト → 有効なLiquidViewSchema
- [ ] Metadata: データベースメタデータ自動抽出
- [ ] Artifact CRUD: 保存/ロード/更新/削除動作
- [ ] E2E: React UI → AI生成 → 表示 までのフロー動作
- [ ] Tests: 新規実装に95%+ カバレッジ
- [ ] Documentation: Setup guide + API docs

### オプション項目
- [ ] Artifact共有機能（Public/Team visibility）
- [ ] AIコスト追跡ダッシュボード
- [ ] スキーマ推奨機能（過去のArtifactから学習）
- [ ] Multi-turn対話（スキーマ改善提案）

---

## セキュリティ考慮事項

### NFR-01: No Arbitrary Code Execution
- ✅ **AI出力はJSON限定** - System promptで強制
- ✅ **厳格なバリデーション** - Schema Validator通過必須
- ✅ **サニタイゼーション** - SQL/JSコード検出→拒否

### NFR-02: Least Privilege
- ✅ **メタデータもRLS適用** - ユーザー権限内のテーブルのみ提示
- ✅ **Artifact所有者検証** - 他人のArtifact編集不可

### NFR-03: Cost Management
- ⚠️ **レート制限** - ユーザー毎、時間毎の制限
- ⚠️ **コスト上限** - アラート/自動停止機能

---

## リスク管理

### リスク1: AI不正出力（非JSONレスポンス）
- **対策**: Strict JSON parsing + Retry (最大3回)
- **軽減**: Few-shot examplesでJSON限定を強化

### リスク2: AIコスト暴走
- **対策**: レート制限 + コスト追跡 + アラート
- **軽減**: Local LLM fallback option

### リスク3: メタデータ漏洩
- **対策**: RLS厳格適用 + 監査ログ
- **軽減**: メタデータ最小化（カラム名のみ、サンプルデータなし）

---

## 次のアクション

1. **環境変数設定**: `.env.example` 作成
2. **AI Provider選択**: Claude Haiku/Gemini Flash/DeepSeek/Local どれから開始？
3. **Metadata Extraction**: reinhardt-web introspection実装
4. **プロンプト設計**: System prompt + Few-shot examples作成
5. **TDD開始**: `packages/ai-provider/tests/mock-provider.test.ts`

準備完了後、AI統合開発開始！
