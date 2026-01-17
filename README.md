# 🌊 Project Liquid

[![Quality Gate](https://github.com/ablaze/liqueur/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/ablaze/liqueur/actions/workflows/quality-gate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-112%20passed-brightgreen)](./DONE.md)
[![Coverage](https://img.shields.io/badge/coverage-88.49%25-green)](./DONE.md)

**AIで自然言語からダッシュボードを生成 - コード実行なし、スキーマのみで安全に**

---

## 🎯 これは何？

**Project Liquid**は、AIを使って自然言語からUIを生成するシステムです。**最大の特徴は、AIにコードを書かせない**こと。

### 従来のAI UI生成の問題点

❌ AIがJavaScript/SQLコードを直接生成 → **XSS、SQLインジェクションのリスク**
❌ 生成されたコードをそのまま実行 → **セキュリティ脆弱性**
❌ 毎回異なるコードが生成される → **メンテナンス不可能**

### Liquidのアプローチ

✅ **AIはJSONスキーマのみ生成** → コード実行なし
✅ **Rust型システムで厳格に検証** → 不正なスキーマは即座にエラー
✅ **既存バックエンドをそのまま活用** → 新しいORMは不要
✅ **Row-Level Security強制** → ユーザー権限を超えた情報は取得不可

---

## 🚀 5分クイックスタート

### 前提条件

- Node.js 20+ / Rust 1.75+
- AIプロバイダーのAPIキー（Anthropic、Gemini、OpenAI、**DeepSeek**のいずれか）

### 1. セットアップ

```bash
git clone https://github.com/ablaze/liqueur.git
cd liqueur

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .envを編集してAPIキーを設定
```

### 2. .env設定（例: DeepSeek）

```bash
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_MODEL=deepseek-chat
```

### 3. 開発サーバー起動

```bash
npm run dev -w @liqueur/playground
# → http://localhost:3000 で起動
```

### 4. AIでダッシュボード生成

```bash
curl -X POST http://localhost:3000/api/liquid/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "月別の支出をバーチャートで表示",
    "metadata": {
      "tables": [{
        "name": "expenses",
        "columns": [
          {"name": "amount", "type": "decimal"},
          {"name": "category", "type": "string"},
          {"name": "month", "type": "date"}
        ]
      }]
    }
  }'
```

**レスポンス**: AIが生成したJSONスキーマ（6秒、コスト$0.0014）

```json
{
  "schema": {
    "version": "1.0",
    "components": [{
      "type": "chart",
      "variant": "bar",
      "title": "Monthly Expenses",
      "data_source": "ds_expenses"
    }],
    "data_sources": {
      "ds_expenses": {
        "resource": "expenses",
        "aggregation": {"type": "sum", "field": "amount", "by": "month"}
      }
    }
  },
  "metadata": {
    "provider": "deepseek",
    "estimatedCost": 0.0014
  }
}
```

---

## 💡 実際のユースケース

### 1. 経費ダッシュボード生成

**入力（自然言語）**:
```
"カテゴリ別の支出を円グラフで表示して、上位10件の経費を表で見せて"
```

**出力**: 2つのコンポーネント（円グラフ + テーブル）を含むJSONスキーマ

### 2. 売上トレンド分析

**入力**:
```
"過去6ヶ月の売上推移を折れ線グラフで表示。前年同月比も追加"
```

**出力**: データソース定義（集計、フィルタ、ソート）を含むスキーマ

### 3. リアルタイムモニタリング

**入力**:
```
"サーバーのCPU使用率とメモリ使用率をリアルタイムで監視"
```

**出力**: 複数のメトリクスを表示するダッシュボードスキーマ

---

## 🏗️ アーキテクチャ（3層Server-Driven UI）

```
┌─────────────────────────────────────────────────────────┐
│ 1. Frontend (React/Next.js)                              │
│    - ユーザーが自然言語でリクエスト                      │
│    - AIが生成したJSONスキーマをUIにレンダリング          │
└──────────────────┬──────────────────────────────────────┘
                   │ JSON Schema
┌──────────────────▼──────────────────────────────────────┐
│ 2. Protocol Layer (TypeScript + Rust)                   │
│    - AIがJSONスキーマを生成                              │
│    - 厳格な型チェック（不正スキーマは即座にエラー）      │
│    - DataSource → ORM変換                               │
└──────────────────┬──────────────────────────────────────┘
                   │ Validated Query
┌──────────────────▼──────────────────────────────────────┐
│ 3. Backend (Rust/reinhardt-web)                         │
│    - Row-Level Security適用（ユーザー権限チェック）     │
│    - データベースクエリ実行                              │
│    - 結果をフロントエンドに返却                          │
└─────────────────────────────────────────────────────────┘
```

**重要な原則**:
1. **AIはJSONのみ出力** → SQL/JavaScriptコード生成禁止
2. **Rust型システムで検証** → 定義外フィールドは即座にエラー
3. **Row-Level Security強制** → ユーザー権限を超えた情報は取得不可

---

## ✅ 現在の状態（Phase 2完了）

### 実装済み機能（全14機能）

| 機能 | 説明 | 状態 |
|------|------|------|
| **FR-01** | AI JSON生成 | ✅ Anthropic, Gemini, OpenAI, **DeepSeek**, GLM, Local LLM |
| **FR-02** | メタデータ提示 | ✅ Caching付き（1時間TTL） |
| **FR-03** | JSON限定出力 | ✅ Code execution防止 |
| **FR-04** | スキーマ検証（厳密型） | ✅ Fail Fast |
| **FR-05** | Fail Fast | ✅ 不正スキーマ即座にエラー |
| **FR-06** | DataSource→ORM変換 | ✅ Rust実装 |
| **FR-07** | Row-Level Security | ✅ 強制適用 |
| **FR-08** | UIレンダリング (React) | ✅ Chart, Table対応 |
| **FR-09** | ローディング状態 | ✅ React実装 |
| **FR-10** | スキーマ保存 | ✅ Artifact永続化 |
| **FR-11** | スキーマロード | ✅ Artifact取得 |
| **FR-12** | レート制限 | ✅ DDoS保護（10 req/min） |
| **FR-13** | キャッシング | ✅ パフォーマンス最適化 |
| **FR-14** | 入力検証 | ✅ セキュリティ対策 |

### 品質指標

```
✅ Tests:        112/112 passed (100% success rate)
✅ Coverage:     88.49% statements, 86.8% branches, 100% functions
✅ Build:        Production build successful
✅ Type Safety:  100% TypeScript compliance
✅ DeepSeek:     9/9 integration tests passed ($0.0014/request)
```

### できること

- ✅ 自然言語からダッシュボード生成（Chart, Table）
- ✅ 集計・フィルタ・ソート（DataSource定義）
- ✅ 複数AIプロバイダー対応（コスト最適化可能）
- ✅ レート制限・キャッシング（本番対応）
- ✅ スキーマ保存・再利用（Artifact機能）

### できないこと（Phase 3で実装予定）

- ⏸️ 実データベース統合（現在はモックメタデータ）
- ⏸️ 認証・認可（JWT/Session管理）
- ⏸️ ユーザー管理・RBAC
- ⏸️ コスト追跡ダッシュボード
- ⏸️ プロダクション監視（Prometheus/OpenTelemetry）

---

## 🧪 テスト実行

```bash
# 全テスト実行（112テスト）
npm test

# カバレッジ確認
npm test -- --coverage

# DeepSeek実AI統合テスト（API key必要）
AI_PROVIDER=deepseek DEEPSEEK_API_KEY=sk-your-key npm test -- ai-real-integration

# Rustテスト
cargo test --workspace
```

---

## 📦 対応AIプロバイダー

| プロバイダー | モデル | コスト目安 | レスポンス時間 |
|------------|--------|----------|--------------|
| **DeepSeek** ✨ | deepseek-chat | $0.0014/req | 5-7秒 |
| Anthropic | claude-3-haiku | $0.0003/req | 2-3秒 |
| Google Gemini | gemini-1.5-flash | $0.00015/req | 1-2秒 |
| OpenAI | gpt-4o-mini | $0.0002/req | 3-4秒 |
| GLM | glm-4 | $0.001/req | 4-5秒 |
| Local LLM | LM Studio | 無料 | 変動 |

✨ **DeepSeek推奨**: コスパ良好、実AI統合テスト済み

---

## 📚 プロジェクト構造

```
liqueur/
├── packages/                    # TypeScript packages
│   ├── protocol/               # @liqueur/protocol - コアプロトコル（96.76% coverage）
│   ├── react/                  # @liqueur/react - UIコンポーネント（99.46% coverage）
│   ├── ai-provider/            # @liqueur/ai-provider - AIプロバイダー抽象化
│   ├── artifact-store/         # @liqueur/artifact-store - Artifact永続化
│   └── playground/             # 開発用Next.jsアプリ
│
├── crates/                     # Rust crates
│   ├── liquid-protocol/        # Serde構造体とバリデーター（95.7% coverage）
│   └── liquid-reinhardt/       # reinhardt-webアダプター（100% coverage）
│
└── docs/                       # ドキュメント
    ├── PROJECT-COMPLETION.md   # 完全な仕様書
    ├── CLAUDE.md               # 開発ガイド
    ├── DONE.md                 # 完成報告書
    └── phase2-final-completion.md
```

---

## 🛠️ 開発ワークフロー

### 1. 新機能追加（TDD厳守）

```bash
# 1. ブランチ作成
git checkout -b feature/new-component

# 2. Red: 失敗するテストを作成
npm run test:watch

# 3. Green: 最小実装でテストをパス
# 4. Refactor: コード改善

# 5. カバレッジ確認（95%以上必須）
npm test -- --coverage

# 6. コミット
git commit -m "feat: add new component"
```

### 2. コード品質チェック

```bash
# 型チェック
npm run typecheck

# Lint
npm run lint

# フォーマット
npm run format

# Rustチェック
cargo clippy --workspace
```

---

## 📖 ドキュメント

### 開発者向け

- **[CLAUDE.md](./CLAUDE.md)** - Claude Code開発ガイド（TDD手順、機能要件マッピング）
- **[PROJECT-COMPLETION.md](./docs/PROJECT-COMPLETION.md)** - 完全な仕様書
- **[DONE.md](./DONE.md)** - Phase 2完了報告書（DeepSeek統合含む）

### アーキテクチャ

- [Architecture Philosophy](./docs/Liquid%20Architecture%20Philosophy.md) - 設計思想
- [Layer Requirements](./docs/Liquid%20Layer%20Requirements.md) - 各層の責務
- [Protocol Specification](./docs/Project%20Liquid%20Proposal.md) - プロトコル仕様

---

## 🚧 Phase 3 ロードマップ（オプション）

現時点でPhase 2まで完了しており、**プロトタイプとしては動作可能**です。
本番運用には以下のPhase 3実装を推奨します：

### 必須実装

1. **実DB統合**
   - Prisma/Drizzle introspection
   - リアルタイムメタデータ取得
   - サンプルデータ生成

2. **認証・認可**
   - JWT実装
   - ユーザー管理
   - RBAC (Role-Based Access Control)

3. **コスト追跡**
   - トークン使用量記録
   - ダッシュボード表示
   - アラート設定

4. **監視・ログ**
   - Prometheus metrics
   - OpenTelemetry tracing
   - Structured logging

5. **スケーラビリティ**
   - Redis caching
   - Load balancing
   - Horizontal scaling

---

## 🤝 Contributing

コントリビューションを歓迎します！

### 開発ルール

- **TDD厳守**: 実装前に必ずテストを作成
- **カバレッジ88%以上**: CI強制、未満はビルド失敗
- **型安全性**: TypeScript strictモード、Rust clippy必須
- **ドキュメント**: API変更時は必ず更新

詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

---

## 📜 ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) を参照してください。

---

## 🙏 謝辞

このプロジェクトは [reinhardt-web](https://github.com/kent8192/reinhardt-web) を基盤としています。

---

## 🎯 まとめ

**Project Liquidは、AIで自然言語からUIを生成する、セキュアなServer-Driven UIシステムです。**

### なぜLiquidを使うのか？

- ✅ **安全**: AIにコードを書かせない、スキーマのみで実行
- ✅ **高速**: 既存バックエンドをそのまま活用、新しいORM不要
- ✅ **低コスト**: 複数AIプロバイダー対応、最適なモデルを選択可能
- ✅ **高品質**: 88%テストカバレッジ、112テスト全pass

### 今すぐ始める

```bash
git clone https://github.com/ablaze/liqueur.git
cd liqueur
npm install
cp .env.example .env
# .envでAI_PROVIDER=deepseekを設定
npm run dev -w @liqueur/playground
```

**ステータス**: ✅ **Phase 2完了 - プロトタイプ動作可能** 🚀

---

**作成者**: Claude Sonnet 4.5
**バージョン**: 1.0.0-rc1
**最終更新**: 2026-01-17
