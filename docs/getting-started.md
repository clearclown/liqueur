# Getting Started with Project Liquid

このガイドでは、Project Liquidの環境セットアップから、初めてのLiquid Viewの作成までを段階的に説明します。

## 目次

1. [環境セットアップ](#環境セットアップ)
2. [プロジェクト構造の理解](#プロジェクト構造の理解)
3. [初めてのLiquid View作成](#初めてのliquid-view作成)
4. [チュートリアル: 静的JSONからUIを生成](#チュートリアル-静的jsonからuiを生成)
5. [次のステップ](#次のステップ)

---

## 環境セットアップ

### 必要な環境

Project Liquidを開発するには、以下のツールが必要です：

| ツール | バージョン | 確認コマンド |
|--------|-----------|-------------|
| Node.js | 20.0.0以上 | `node --version` |
| npm | 10.0.0以上 | `npm --version` |
| Rust | 1.75以上 | `rustc --version` |
| cargo | 1.75以上 | `cargo --version` |
| Git | 2.30以上 | `git --version` |

### インストール手順

#### 1. リポジトリのクローン

```bash
# HTTPSでクローン
git clone https://github.com/ablaze/liqueur.git
cd liqueur

# または、SSHでクローン
git clone git@github.com:ablaze/liqueur.git
cd liqueur
```

#### 2. Git Submoduleの初期化

Project Liquidは`reinhardt-web`をsubmoduleとして使用しています：

```bash
# Submoduleを初期化して取得
git submodule update --init --recursive

# 確認
ls external/reinhardt-web
```

#### 3. TypeScript依存関係のインストール

```bash
# ルートディレクトリで実行
npm install

# workspaces内の全パッケージに依存関係がインストールされる
# packages/protocol, packages/reactなど
```

#### 4. Rustプロジェクトのビルド

```bash
# 全Rustクレートをビルド
cargo build --workspace

# リリースビルド（本番用）
cargo build --workspace --release
```

#### 5. 環境の確認

すべてが正しくセットアップされたか確認します：

```bash
# TypeScript型チェック
npm run typecheck

# TypeScriptテスト実行
npm test

# Rustテスト実行
cargo test --workspace
```

すべてのコマンドが成功すれば、環境セットアップは完了です！

---

## プロジェクト構造の理解

Project Liquidはモノレポ構成で、TypeScriptとRustの両方を含みます：

```
liqueur/
├── packages/                    # TypeScript packages (npm workspaces)
│   ├── protocol/               # @liqueur/protocol
│   │   ├── src/
│   │   │   ├── types/          # TypeScript型定義
│   │   │   ├── validators/     # スキーマバリデーター
│   │   │   └── schema/         # JSON Schema定義
│   │   └── tests/              # Vitestテスト
│   │
│   ├── react/                  # @liqueur/react
│   │   ├── src/
│   │   │   ├── components/     # Reactコンポーネント
│   │   │   ├── layouts/        # レイアウトコンポーネント
│   │   │   └── hooks/          # カスタムフック
│   │   └── tests/              # React Testing Library
│   │
│   └── playground/             # 開発用Next.jsアプリ
│
├── crates/                     # Rust crates (Cargo workspace)
│   ├── liquid-protocol/        # Serde構造体とバリデーター
│   └── liquid-reinhardt/       # reinhardt-webアダプター
│
└── external/                   # Git submodules
    └── reinhardt-web/          # Rustバックエンド
```

### 主要なパッケージ

- **@liqueur/protocol**: プロトコルのコア定義（TypeScript型、バリデーター、JSON Schema）
- **@liqueur/react**: UIコンポーネントライブラリ（LiquidRenderer、Chart、Table等）
- **liquid-protocol (Rust)**: Serde構造体とバリデーター（バックエンド用）
- **liquid-reinhardt**: reinhardt-webとの統合アダプター

---

## 初めてのLiquid View作成

Liquid Viewは、JSON Schemaで定義されたUIの設計図です。最も簡単な例から始めましょう。

### Step 1: 最小構成のLiquid View Schema

以下は、何も表示しない最小構成のスキーマです：

```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "props": { "columns": 1 },
    "children": []
  },
  "data_sources": {}
}
```

**説明**:
- `version`: プロトコルバージョン（現在は`"1.0"`のみ対応）
- `layout`: UIのレイアウト構造
  - `type`: レイアウトタイプ（`"grid"`, `"stack"`, `"flex"`）
  - `props`: レイアウト固有のプロパティ
  - `children`: 子コンポーネントの配列
- `data_sources`: データソースの定義（キー: DataSource ID）

### Step 2: チャートコンポーネントを追加

データソースなしの静的チャートを追加します：

```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "props": { "columns": 1 },
    "children": [
      {
        "type": "chart",
        "variant": "bar",
        "title": "My First Chart"
      }
    ]
  },
  "data_sources": {}
}
```

**説明**:
- `type: "chart"`: チャートコンポーネント
- `variant`: チャートの種類（`"bar"`, `"line"`, `"pie"`, `"area"`）
- `title`: チャートのタイトル

### Step 3: DataSourceを定義

実際のデータと接続します：

```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "props": { "columns": 1 },
    "children": [
      {
        "type": "chart",
        "variant": "bar",
        "title": "Monthly Sales",
        "data_source": "ds_sales"
      }
    ]
  },
  "data_sources": {
    "ds_sales": {
      "resource": "sales",
      "aggregation": {
        "type": "sum",
        "field": "amount",
        "by": "month"
      }
    }
  }
}
```

**説明**:
- `data_source`: コンポーネントが使用するDataSource ID
- `data_sources.ds_sales`: DataSourceの定義
  - `resource`: バックエンドのリソース名（テーブル/モデル名）
  - `aggregation`: 集計方法
    - `type`: 集計関数（`"sum"`, `"avg"`, `"count"`, `"min"`, `"max"`）
    - `field`: 集計対象のフィールド
    - `by`: GROUP BY句（月別集計）

### Step 4: フィルタを追加

特定の条件でデータを絞り込みます：

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
        "title": "Monthly Sales (excluding refunds)",
        "data_source": "ds_sales_filtered"
      },
      {
        "type": "table",
        "title": "Top 10 Products",
        "columns": ["product_name", "total_sales"],
        "data_source": "ds_top_products"
      }
    ]
  },
  "data_sources": {
    "ds_sales_filtered": {
      "resource": "sales",
      "filters": [
        { "field": "status", "op": "neq", "value": "refunded" }
      ],
      "aggregation": {
        "type": "sum",
        "field": "amount",
        "by": "month"
      }
    },
    "ds_top_products": {
      "resource": "sales",
      "aggregation": {
        "type": "sum",
        "field": "amount",
        "by": "product_id"
      },
      "sort": {
        "field": "amount",
        "direction": "desc"
      },
      "limit": 10
    }
  }
}
```

**説明**:
- `filters`: フィルタ条件の配列
  - `field`: フィルタ対象フィールド
  - `op`: 演算子（`"eq"`, `"neq"`, `"gt"`, `"gte"`, `"lt"`, `"lte"`, `"in"`, `"contains"`）
  - `value`: 比較値
- `sort`: ソート条件
  - `field`: ソート対象フィールド
  - `direction`: `"asc"`（昇順）または`"desc"`（降順）
- `limit`: 取得件数の制限

---

## チュートリアル: 静的JSONからUIを生成

実際にコードを書いて、Liquid ViewをReactでレンダリングしてみましょう。

### 前提条件

このチュートリアルは、環境セットアップが完了していることを前提とします。

### Step 1: TypeScriptでスキーマをバリデーション

`packages/protocol`を使用してスキーマを検証します。

```bash
cd packages/protocol
```

`example.ts`ファイルを作成：

```typescript
import { SchemaValidator } from "./src/validators/schema";
import type { LiquidViewSchema } from "./src/types";

const schema: LiquidViewSchema = {
  version: "1.0",
  layout: {
    type: "grid",
    props: { columns: 2 },
    children: [
      {
        type: "chart",
        variant: "bar",
        title: "Monthly Expenses",
        data_source: "ds_expenses"
      },
      {
        type: "chart",
        variant: "pie",
        title: "Category Breakdown",
        data_source: "ds_categories"
      }
    ]
  },
  data_sources: {
    ds_expenses: {
      resource: "expenses",
      aggregation: {
        type: "sum",
        field: "amount",
        by: "month"
      },
      filters: [
        { field: "year", op: "eq", value: 2024 }
      ]
    },
    ds_categories: {
      resource: "expenses",
      aggregation: {
        type: "sum",
        field: "amount",
        by: "category"
      }
    }
  }
};

const validator = new SchemaValidator();
const result = validator.validate(schema);

if (result.valid) {
  console.log("✅ Schema is valid!");
  console.log(JSON.stringify(schema, null, 2));
} else {
  console.error("❌ Validation errors:");
  result.errors.forEach(err => {
    console.error(`  - ${err.message} (path: ${err.path})`);
  });
}
```

実行：

```bash
npx tsx example.ts
```

### Step 2: Reactでレンダリング

`packages/react`を使用してUIをレンダリングします。

```typescript
import React from "react";
import { LiquidRenderer } from "@liqueur/react";
import type { LiquidViewSchema } from "@liqueur/protocol";

const schema: LiquidViewSchema = {
  // ... 上記と同じスキーマ
};

// モックデータ（実際はバックエンドから取得）
const mockData = {
  ds_expenses: [
    { month: "Jan", value: 1200 },
    { month: "Feb", value: 1500 },
    { month: "Mar", value: 1300 },
    { month: "Apr", value: 1700 }
  ],
  ds_categories: [
    { name: "Food", value: 3200 },
    { name: "Transport", value: 1500 },
    { name: "Entertainment", value: 800 }
  ]
};

function App() {
  return (
    <div className="container">
      <h1>My Dashboard</h1>
      <LiquidRenderer
        schema={schema}
        data={mockData}
        loading={false}
      />
    </div>
  );
}

export default App;
```

### Step 3: Playgroundで実行

開発用のPlaygroundアプリで動作確認します：

```bash
cd packages/playground
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開くと、2つのチャートが表示されます。

### Step 4: Rustバックエンドとの統合

Rustバックエンドでスキーマを検証し、データを取得します。

```rust
use liquid_protocol::schema::LiquidViewSchema;
use liquid_protocol::validator::SchemaValidator;
use liquid_reinhardt::{DataSourceConverter, SecurityEnforcer};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // JSONスキーマをデシリアライズ
    let schema_json = r#"{
        "version": "1.0",
        "layout": { ... },
        "data_sources": { ... }
    }"#;

    let schema: LiquidViewSchema = serde_json::from_str(schema_json)?;

    // バリデーション
    let validator = SchemaValidator::new();
    validator.validate(&schema)?;

    println!("✅ Schema validated successfully");

    // DataSourceを安全なクエリに変換
    let mut converter = DataSourceConverter::new();
    converter.register_resource("expenses".to_string(), "expenses_table".to_string());

    for (ds_id, data_source) in &schema.data_sources {
        let query = converter.convert(data_source)?;
        println!("DataSource '{}' converted to query", ds_id);

        // Row-Level Securityを適用
        let enforcer = SecurityEnforcer::new();
        let current_user = get_current_user(); // ユーザーコンテキスト取得
        let secure_query = enforcer.enforce(&data_source.resource, query, &current_user)?;

        // クエリ実行
        let results = secure_query.execute().await?;
        println!("  - {} rows fetched", results.len());
    }

    Ok(())
}
```

---

## 次のステップ

### より詳しく学ぶ

- [Architecture Overview](architecture/overview.md) - アーキテクチャの詳細
- [Protocol Specification](architecture/protocol-spec.md) - JSON Schema完全仕様
- [Security Model](architecture/security-model.md) - セキュリティ設計
- [TDD Guide](development/tdd-guide.md) - テスト駆動開発

### 実践的な例

プロジェクトの`examples/`ディレクトリには、以下の実践例があります：

- `examples/basic-dashboard/` - 基本的なダッシュボード
- `examples/filtered-chart/` - フィルタ付きチャート
- `examples/multi-datasource/` - 複数DataSource統合
- `examples/custom-component/` - カスタムコンポーネント作成

### コントリビューション

Project Liquidへの貢献に興味がある場合は、[Contributing Guide](development/contributing.md) をご覧ください。

- Issue報告
- 機能提案
- コード貢献
- ドキュメント改善

すべてのコントリビューションを歓迎します！

---

**質問やサポートが必要な場合は、[GitHub Discussions](https://github.com/ablaze/liqueur/discussions) をご利用ください。**
