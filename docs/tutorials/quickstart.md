# クイックスタート: 初めてのAI生成ダッシュボード

このチュートリアルでは、Project Liquidを使って**自然言語からダッシュボードを生成**する方法を学びます。

## 所要時間

約10分

## 前提条件

- **Node.js 20+** がインストールされていること
- **Rust 1.75+** がインストールされていること（Rustバックエンドを使用する場合）
- AIプロバイダーのAPIキー（以下のいずれか）
  - DeepSeek（推奨：コスパ良好）
  - Anthropic Claude
  - Google Gemini
  - OpenAI

---

## Step 1: プロジェクトセットアップ

### リポジトリのクローン

```bash
git clone https://github.com/clearclown/liqueur.git
cd liqueur
```

### 依存関係のインストール

```bash
# npm workspacesで全パッケージをインストール
npm install
```

### 環境変数の設定

```bash
# テンプレートをコピー
cp .env.example .env
```

---

## Step 2: AIプロバイダーの設定

`.env`ファイルを編集して、使用するAIプロバイダーを設定します。

### DeepSeek（推奨）

```bash
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_MODEL=deepseek-chat
```

### Anthropic Claude

```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

### Google Gemini

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-1.5-flash
```

### OpenAI

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

---

## Step 3: 開発サーバーの起動

```bash
npm run dev -w @liqueur/playground
```

ブラウザで http://localhost:3000 を開きます。

---

## Step 4: 最初のダッシュボードを生成

### APIを直接呼び出す

```bash
curl -X POST http://localhost:3000/api/liquid/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "月別の支出をバーチャートで表示して",
    "metadata": {
      "tables": [{
        "name": "expenses",
        "columns": [
          {"name": "id", "type": "integer"},
          {"name": "amount", "type": "decimal"},
          {"name": "category", "type": "string"},
          {"name": "month", "type": "date"},
          {"name": "user_id", "type": "integer"}
        ]
      }]
    }
  }'
```

### レスポンス例

```json
{
  "schema": {
    "version": "1.0",
    "layout": {
      "type": "grid",
      "columns": 1
    },
    "components": [
      {
        "type": "chart",
        "variant": "bar",
        "title": "月別支出",
        "data_source": "ds_monthly_expenses",
        "x_axis": "month",
        "y_axis": "total_amount"
      }
    ],
    "data_sources": {
      "ds_monthly_expenses": {
        "resource": "expenses",
        "aggregation": {
          "type": "sum",
          "field": "amount",
          "by": "month"
        },
        "sort": {
          "field": "month",
          "direction": "asc"
        }
      }
    }
  },
  "metadata": {
    "provider": "deepseek",
    "model": "deepseek-chat",
    "estimatedCost": 0.0014
  }
}
```

---

## Step 5: より複雑なダッシュボードを生成

### 複数コンポーネントの生成

```bash
curl -X POST http://localhost:3000/api/liquid/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "カテゴリ別支出を円グラフで、上位10件の明細をテーブルで表示して。旅費は除外して。",
    "metadata": {
      "tables": [{
        "name": "expenses",
        "columns": [
          {"name": "id", "type": "integer"},
          {"name": "description", "type": "string"},
          {"name": "amount", "type": "decimal"},
          {"name": "category", "type": "string"},
          {"name": "date", "type": "date"},
          {"name": "user_id", "type": "integer"}
        ]
      }]
    }
  }'
```

### 生成されるスキーマ

AIは以下のようなスキーマを生成します：

```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "columns": 2,
    "gap": "16px"
  },
  "components": [
    {
      "type": "chart",
      "variant": "pie",
      "title": "カテゴリ別支出（旅費除く）",
      "data_source": "ds_by_category"
    },
    {
      "type": "table",
      "title": "支出明細（上位10件）",
      "data_source": "ds_top_expenses",
      "columns": [
        {"field": "description", "header": "説明"},
        {"field": "amount", "header": "金額"},
        {"field": "category", "header": "カテゴリ"},
        {"field": "date", "header": "日付"}
      ]
    }
  ],
  "data_sources": {
    "ds_by_category": {
      "resource": "expenses",
      "filters": [
        {"field": "category", "op": "neq", "value": "travel"}
      ],
      "aggregation": {
        "type": "sum",
        "field": "amount",
        "by": "category"
      }
    },
    "ds_top_expenses": {
      "resource": "expenses",
      "filters": [
        {"field": "category", "op": "neq", "value": "travel"}
      ],
      "sort": {
        "field": "amount",
        "direction": "desc"
      },
      "limit": 10
    }
  }
}
```

---

## Step 6: スキーマの保存と読み込み

### 保存

```bash
curl -X POST http://localhost:3000/api/liquid/artifacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "経費ダッシュボード",
    "schema": { ... }
  }'
```

### 読み込み

```bash
curl http://localhost:3000/api/liquid/artifacts/{artifact_id}
```

---

## Step 7: Reactでレンダリング

生成されたスキーマを`@liqueur/react`でレンダリングできます：

```tsx
import { LiquidRenderer } from '@liqueur/react';

function Dashboard() {
  const schema = /* 生成されたスキーマ */;
  const data = /* バックエンドから取得したデータ */;

  return (
    <LiquidRenderer
      schema={schema}
      data={data}
      loading={false}
    />
  );
}
```

---

## 理解を深める

### 何が起きているのか

1. **自然言語入力**: ユーザーが「月別の支出をバーチャートで」と入力
2. **AI処理**: LLMがデータベーススキーマを参照し、適切なJSONスキーマを生成
3. **型検証**: 生成されたスキーマがTypeScript/Rust型定義に準拠しているか検証
4. **レンダリング**: 検証済みスキーマがReactコンポーネントに変換

### なぜ安全なのか

- AIはJSONスキーマ**のみ**を生成（JavaScript/SQLは生成しない）
- 不正なフィールドは**即座にエラー**（Fail Fast）
- Row-Level Securityが**強制適用**（ユーザー権限チェック）

---

## 次のステップ

- **[コア概念を理解する](./concepts.md)** - Artifact、DataSource、RLSについて
- **[哲学を学ぶ](../philosophy/why-liquid.md)** - Liquidが生まれた背景
- **[APIリファレンス](../api/overview.md)** - 全APIエンドポイント

---

## トラブルシューティング

### APIキーエラー

```
Error: Invalid API key
```

→ `.env`ファイルのAPIキーが正しいか確認してください。

### レート制限エラー

```
Error: Rate limit exceeded
```

→ 1分間に10リクエストまでに制限されています。少し待ってから再試行してください。

### スキーマ検証エラー

```
Error: Invalid schema: unknown field 'customField'
```

→ AIが未定義のフィールドを生成しました。プロンプトを調整するか、Issue報告してください。

---

**質問やフィードバック**: [GitHub Issues](https://github.com/clearclown/liqueur/issues)
