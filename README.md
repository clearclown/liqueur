# Project Liquid

[![Quality Gate](https://github.com/ablaze/liqueur/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/ablaze/liqueur/actions/workflows/quality-gate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 概要

**Project Liquid** は、AI駆動の動的UI生成機能をエンタープライズグレードの安全性で実装するプロトコル・SDKスイートです。Server-Driven UI (SDUI) アーキテクチャに基づき、AIの柔軟性とRustの堅牢性を融合させます。

### 核心哲学

- **AIにはコードを書かせない**: JSONスキーマのみを出力、実行可能コードは生成させない
- **Security by Design**: Rust型システムによる厳格な検証でXSS/SQLインジェクションを防止
- **Backend Agnostic**: プロトコル駆動で言語非依存（Rust/Python/Go対応）

## 特徴

- 🔒 **Security by Design**: AIはJSONスキーマのみ出力、バックエンドで厳密に検証
- ⚡ **Backend Agnostic**: 既存のRust/Python/Goバックエンドをそのまま活用可能
- 🎨 **Zero-Code Customization**: ユーザーは自然言語で意図を伝えるだけでUIを生成
- 🏗️ **Server-Driven UI**: JSON Schemaでフロントエンドとバックエンドを疎結合化
- 🧪 **Test-Driven**: 95%以上のテストカバレッジを強制
- 📦 **Monorepo**: TypeScript + Rustのハイブリッド構成

## アーキテクチャ

Project Liquidは3層のServer-Driven UIアーキテクチャを採用しています：

```
┌─────────────────────────────────────────────────┐
│ Frontend Layer (Consumer)                        │
│ - Next.js + React                              │
│ - JSON → UIレンダリング                         │
│ - AIとの対話管理                                │
└────────────┬────────────────────────────────────┘
             │ (Liquid Protocol JSON)
┌────────────▼────────────────────────────────────┐
│ Protocol Layer (Interface)                      │
│ - JSON Schema定義                              │
│ - UIコンポーネント仕様                          │
│ - DataSource抽象化                            │
└────────────┬────────────────────────────────────┘
             │ (Serialized Schema + Metadata)
┌────────────▼────────────────────────────────────┐
│ Backend Layer (Provider)                        │
│ - reinhardt-web (Rust)                        │
│ - スキーマ検証 (Strict Deserialization)       │
│ - Row-Level Security適用                       │
│ - ORM→クエリ変換                               │
└─────────────────────────────────────────────────┘
```

## クイックスタート

### 必要環境

- **Node.js**: 20.0.0以上
- **Rust**: 1.75以上
- **Git**: submodule機能を使用

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/ablaze/liqueur.git
cd liqueur

# サブモジュールを初期化
git submodule update --init --recursive

# TypeScript依存関係をインストール
npm install

# Rust依存関係をビルド
cargo build --workspace
```

### 基本的な使い方

#### 1. Liquid View Schemaを定義

```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "props": { "columns": 2 },
    "children": [
      {
        "type": "chart",
        "variant": "bar",
        "title": "Monthly Expenses",
        "data_source": "ds_expenses_monthly"
      }
    ]
  },
  "data_sources": {
    "ds_expenses_monthly": {
      "resource": "expenses",
      "aggregation": { "type": "sum", "field": "amount", "by": "month" },
      "filters": [
        { "field": "category", "op": "neq", "value": "travel" }
      ]
    }
  }
}
```

#### 2. TypeScriptでバリデーション

```typescript
import { SchemaValidator } from "@liqueur/protocol";

const validator = new SchemaValidator();
const result = validator.validate(schema);

if (!result.valid) {
  console.error("Validation errors:", result.errors);
}
```

#### 3. Reactで描画

```typescript
import { LiquidRenderer } from "@liqueur/react";

function App() {
  return (
    <LiquidRenderer
      schema={liquidViewSchema}
      data={fetchedData}
      loading={false}
    />
  );
}
```

#### 4. Rustでデータ取得

```rust
use liquid_reinhardt::{DataSourceConverter, SecurityEnforcer};

// DataSourceを安全なクエリに変換
let converter = DataSourceConverter::new();
let query = converter.convert(&data_source)?;

// Row-Level Securityを適用
let enforcer = SecurityEnforcer::new();
let secure_query = enforcer.enforce("expenses", query, &current_user)?;

// クエリ実行
let results = secure_query.execute().await?;
```

## プロジェクト構造

```
liqueur/
├── packages/                    # TypeScript/JavaScript packages
│   ├── protocol/               # @liqueur/protocol - コアプロトコル定義
│   ├── react/                  # @liqueur/react - UIコンポーネント
│   └── playground/             # 開発用Next.jsアプリ
│
├── crates/                     # Rust crates
│   ├── liquid-protocol/        # Serde構造体とバリデーター
│   └── liquid-reinhardt/       # reinhardt-webアダプター
│
├── external/                   # Git submodules
│   └── reinhardt-web/          # reinhardt-web統合
│
├── docs/                       # ドキュメント
│   ├── architecture/           # アーキテクチャ設計
│   ├── development/            # 開発ガイド
│   └── api/                    # API Reference
│
└── .github/workflows/          # CI/CD パイプライン
```

## 開発

### テスト実行

```bash
# TypeScriptテスト
npm test

# Rustテスト
cargo test --workspace

# カバレッジ確認
npm test -- --coverage
cargo tarpaulin --workspace --out Html
```

### ビルド

```bash
# TypeScript
npm run build

# Rust
cargo build --workspace --release
```

### 型チェック

```bash
# TypeScript
npm run typecheck

# Rust
cargo check --workspace
```

## ドキュメント

- [Getting Started](docs/getting-started.md) - 初めてのLiquid View作成
- [Architecture Overview](docs/architecture/overview.md) - アーキテクチャ詳細
- [Protocol Specification](docs/architecture/protocol-spec.md) - JSON Schema完全仕様
- [Security Model](docs/architecture/security-model.md) - セキュリティ設計
- [TDD Guide](docs/development/tdd-guide.md) - TDD開発手順
- [API Reference](docs/api/) - TypeScript/Rust API
- [CLAUDE.md](CLAUDE.md) - Claude Code開発ガイド

## Phase 1ロードマップ

現在、Phase 1（Protocol策定と基本実装）を進行中です：

- [x] プロジェクト構造セットアップ
- [x] CI/CD パイプライン構築
- [ ] liquid-protocol (TypeScript) - 型定義とバリデーター
- [ ] liquid-protocol (Rust) - Serde構造体とバリデーター
- [ ] @liqueur/react - UIコンポーネントライブラリ
- [ ] liquid-reinhardt - reinhardt-webアダプター
- [ ] Playgroundアプリでの動作デモ

Phase 2ではAI統合（Claude API + Vercel AI SDK）を予定しています。

## Contributing

コントリビューションを歓迎します！詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

### 開発ルール

- **TDD厳守**: 実装前に必ずテストを作成
- **カバレッジ95%以上**: CI強制、未満はビルド失敗
- **型安全性**: TypeScript strictモード、Rust clippy必須
- **ドキュメント**: API変更時は必ず更新

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。

## リンク

- [GitHub Repository](https://github.com/ablaze/liqueur)
- [reinhardt-web](https://github.com/kent8192/reinhardt-web)
- [Documentation](docs/)
- [Issue Tracker](https://github.com/ablaze/liqueur/issues)

## 謝辞

このプロジェクトは [reinhardt-web](https://github.com/kent8192/reinhardt-web) を基盤としています。

---

**Project Liquid** - AI時代のエンタープライズUI構築を安全かつ高速に実現します。
