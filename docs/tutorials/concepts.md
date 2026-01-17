# コア概念: Liquidを支える3つの柱

このドキュメントでは、Project Liquidの核心となる概念を解説します。

## 目次

1. [Artifact（アーティファクト）](#artifact)
2. [DataSource（データソース）](#datasource)
3. [Row-Level Security（行レベルセキュリティ）](#row-level-security)

---

## Artifact

### 定義

**Artifact**とは、AIが生成する**永続的で編集可能な構造化データ**です。

従来のチャットボットはテキストを返すだけでしたが、Liquidでは**UIの定義そのもの**を返します。

### 特徴

| 特徴 | 説明 |
|------|------|
| **永続的** | 保存して再利用できる |
| **編集可能** | 手動で微調整できる |
| **バージョン管理可能** | 変更履歴を追跡できる |
| **言語非依存** | JSON形式でどの言語からも扱える |

### 構造

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
      "variant": "bar",
      "title": "売上推移",
      "data_source": "ds_sales"
    },
    {
      "type": "table",
      "title": "商品一覧",
      "data_source": "ds_products"
    }
  ],
  "data_sources": {
    "ds_sales": { ... },
    "ds_products": { ... }
  }
}
```

### なぜArtifactなのか

**Artifactはコードではなく、意図の純粋な定義です。**

- **コードの問題**: 実装詳細に縛られる、セキュリティリスク、メンテナンス困難
- **Artifactの利点**: 意図のみを記述、実装は各層に委ねる、安全に再利用可能

---

## DataSource

### 定義

**DataSource**とは、データの取得方法を**宣言的に**定義するオブジェクトです。

SQLクエリを直接書くのではなく、「何が欲しいか」を構造化して表現します。

### 基本構造

```json
{
  "ds_monthly_expenses": {
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
      "field": "month",
      "direction": "asc"
    },
    "limit": 12
  }
}
```

### フィールド説明

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `resource` | ✅ | データベースのテーブル/モデル名 |
| `filters` | - | フィルタ条件の配列 |
| `aggregation` | - | 集計定義（sum, avg, count, min, max） |
| `sort` | - | ソート条件 |
| `limit` | - | 取得件数の制限 |

### フィルタ演算子

| 演算子 | 説明 | 例 |
|--------|------|-----|
| `eq` | 等しい | `{"field": "status", "op": "eq", "value": "active"}` |
| `neq` | 等しくない | `{"field": "category", "op": "neq", "value": "travel"}` |
| `gt` | より大きい | `{"field": "amount", "op": "gt", "value": 1000}` |
| `gte` | 以上 | `{"field": "age", "op": "gte", "value": 18}` |
| `lt` | より小さい | `{"field": "price", "op": "lt", "value": 100}` |
| `lte` | 以下 | `{"field": "quantity", "op": "lte", "value": 10}` |
| `in` | 含まれる | `{"field": "status", "op": "in", "value": ["active", "pending"]}` |
| `contains` | 部分一致 | `{"field": "name", "op": "contains", "value": "john"}` |

### 集計タイプ

| タイプ | 説明 | 例 |
|--------|------|-----|
| `sum` | 合計 | 月別の売上合計 |
| `avg` | 平均 | カテゴリ別の平均単価 |
| `count` | 件数 | ステータス別の注文件数 |
| `min` | 最小値 | 商品の最低価格 |
| `max` | 最大値 | 商品の最高価格 |

### 実際の変換例

DataSourceがどのようにSQLに変換されるかの例：

**DataSource定義**:
```json
{
  "resource": "expenses",
  "filters": [
    { "field": "category", "op": "neq", "value": "travel" }
  ],
  "aggregation": {
    "type": "sum",
    "field": "amount",
    "by": "month"
  },
  "sort": { "field": "month", "direction": "asc" },
  "limit": 12
}
```

**生成されるクエリ（概念的）**:
```sql
SELECT
  month,
  SUM(amount) as amount_sum
FROM expenses
WHERE
  category != 'travel'
  AND user_id = $current_user_id  -- RLS自動適用
GROUP BY month
ORDER BY month ASC
LIMIT 12
```

---

## Row-Level Security

### 定義

**Row-Level Security（RLS）**とは、データベースの行レベルでアクセス制御を行う仕組みです。

Liquidでは、**すべてのクエリにRLSが強制適用**されます。

### なぜ重要か

従来のシステムでは、セキュリティチェックを忘れると情報漏洩が発生します：

```python
# 危険な例: ユーザーIDチェックを忘れている
def get_all_expenses():
    return db.query("SELECT * FROM expenses")  # 全ユーザーのデータが見える！
```

Liquidでは、このようなミスは**構造的に不可能**です：

```rust
// 安全: RLSは常に適用される
pub fn get_expenses(schema: &DataSource, user: &CurrentUser) -> Query {
    let query = build_query(schema);
    apply_rls(query, user)  // オプトアウト不可
}
```

### 仕組み

```
┌────────────────────────────────────────────────────────┐
│ 1. DataSource定義を受け取る                            │
│    resource: "expenses"                                │
│    filters: [...]                                      │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ 2. クエリを構築                                        │
│    SELECT * FROM expenses WHERE category != 'travel'   │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ 3. RLS条件を自動追加（強制）                           │
│    ... AND user_id = $current_user_id                  │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ 4. 安全なクエリを実行                                  │
│    ユーザーは自分のデータのみ取得可能                  │
└────────────────────────────────────────────────────────┘
```

### ロールベースの制御

```rust
pub fn apply_rls(query: Query, user: &CurrentUser) -> Query {
    match user.role {
        // 管理者: 全データにアクセス可能
        Role::Admin => query,

        // マネージャー: チームのデータにアクセス可能
        Role::Manager => query.where_clause(
            format!("team_id = {}", user.team_id)
        ),

        // 一般ユーザー: 自分のデータのみ
        Role::User => query.where_clause(
            format!("user_id = {}", user.id)
        ),

        // ゲスト: 公開データのみ
        Role::Guest => query.where_clause(
            "is_public = true"
        ),
    }
}
```

### RLSの利点

| 利点 | 説明 |
|------|------|
| **忘れられない** | 全クエリに自動適用 |
| **一貫性** | 全エンドポイントで同じルール |
| **監査可能** | セキュリティポリシーが一箇所に集約 |
| **テスト容易** | ユニットテストでRLSを検証可能 |

---

## コンポーネントタイプ

### Chart（チャート）

データを視覚化するコンポーネント。

```json
{
  "type": "chart",
  "variant": "bar",
  "title": "月別売上",
  "data_source": "ds_sales",
  "x_axis": "month",
  "y_axis": "amount"
}
```

**バリアント**:
- `bar`: 棒グラフ
- `line`: 折れ線グラフ
- `pie`: 円グラフ
- `area`: 面グラフ

### Table（テーブル）

データを表形式で表示するコンポーネント。

```json
{
  "type": "table",
  "title": "商品一覧",
  "data_source": "ds_products",
  "columns": [
    { "field": "name", "header": "商品名" },
    { "field": "price", "header": "価格" },
    { "field": "stock", "header": "在庫" }
  ]
}
```

---

## レイアウト

### Grid（グリッドレイアウト）

CSS Gridベースのレイアウト。

```json
{
  "type": "grid",
  "columns": 2,
  "gap": "16px"
}
```

### Stack（スタックレイアウト）

Flexboxベースのレイアウト。

```json
{
  "type": "stack",
  "direction": "vertical",
  "gap": "8px"
}
```

---

## まとめ

| 概念 | 役割 | 利点 |
|------|------|------|
| **Artifact** | UIの定義を構造化 | 永続的、再利用可能、言語非依存 |
| **DataSource** | データ取得を宣言的に定義 | 安全、検証可能、ORM非依存 |
| **RLS** | 行レベルでアクセス制御 | 忘れられない、一貫性、監査可能 |

---

**次へ**: [APIリファレンス](../api/overview.md) | [哲学を学ぶ](../philosophy/why-liquid.md)
