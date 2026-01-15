# Protocol Specification

Liquid Protocol v1.0の完全な仕様書です。

## 概要

Liquid Protocolは、AI駆動の動的UI生成を安全に実装するためのJSON Schema仕様です。フロントエンド（TypeScript）とバックエンド（Rust）間の契約書として機能します。

## バージョン

現在のバージョン: **1.0**

## スキーマ構造

### LiquidViewSchema

ルートオブジェクト。UIの完全な定義を含みます。

```typescript
interface LiquidViewSchema {
  version: ProtocolVersion;
  layout: Layout;
  data_sources: Record<string, DataSource>;
}
```

**フィールド**:
- `version` (required): プロトコルバージョン（現在は`"1.0"`のみ）
- `layout` (required): UIレイアウト構造
- `data_sources` (required): DataSourceの定義（空オブジェクト可）

---

## Layout

UIのレイアウト構造を定義します。

### GridLayout

CSS Gridベースのレイアウト。

```typescript
interface GridLayout {
  type: "grid";
  props: {
    columns: number;    // カラム数（1以上）
    gap?: number;       // グリッド間隔（ピクセル、デフォルト: 16）
  };
  children: Component[];
}
```

### StackLayout

Flexboxベースのレイアウト。

```typescript
interface StackLayout {
  type: "stack";
  props: {
    direction: "horizontal" | "vertical";
    spacing?: number;  // アイテム間隔（ピクセル、デフォルト: 8）
  };
  children: Component[];
}
```

---

## Component

UIコンポーネントの定義。

### ChartComponent

チャートコンポーネント（Recharts統合）。

```typescript
interface ChartComponent {
  type: "chart";
  variant: "bar" | "line" | "pie" | "area";
  title?: string;
  data_source?: string;  // DataSource ID
  xAxis?: string;        // X軸フィールド名
  yAxis?: string;        // Y軸フィールド名
}
```

### TableComponent

テーブルコンポーネント。

```typescript
interface TableComponent {
  type: "table";
  columns: string[];     // 表示カラム名の配列
  title?: string;
  data_source?: string;
  sortable?: boolean;    // ソート可能か（デフォルト: false）
}
```

---

## DataSource

データソースの定義。バックエンドでORMクエリに変換されます。

```typescript
interface DataSource {
  resource: string;              // リソース名（テーブル/モデル名）
  filters?: Filter[];            // フィルタ条件
  aggregation?: Aggregation;     // 集計方法
  sort?: Sort;                   // ソート条件
  limit?: number;                // 取得件数制限
}
```

### Filter

フィルタ条件。

```typescript
interface Filter {
  field: string;                 // フィールド名
  op: FilterOperator;            // 演算子
  value: string | number | boolean | Array<string | number>;
}

type FilterOperator = 
  | "eq"       // 等しい
  | "neq"      // 等しくない
  | "gt"       // より大きい
  | "gte"      // 以上
  | "lt"       // より小さい
  | "lte"      // 以下
  | "in"       // 配列に含まれる
  | "contains" // 部分一致
```

### Aggregation

集計方法。

```typescript
interface Aggregation {
  type: "sum" | "avg" | "count" | "min" | "max";
  field: string;       // 集計対象フィールド
  by?: string;         // GROUP BYフィールド
}
```

### Sort

ソート条件。

```typescript
interface Sort {
  field: string;
  direction: "asc" | "desc";
}
```

---

## 検証ルール

### 必須フィールド
- `LiquidViewSchema.version`, `layout`, `data_sources`
- `Layout.type`, `props`, `children`
- `DataSource.resource`

### バリデーションエラー

| コード | 説明 |
|--------|------|
| `UNSUPPORTED_VERSION` | 未対応のバージョン |
| `INVALID_LAYOUT_TYPE` | 不正なレイアウトタイプ |
| `INVALID_COMPONENT_TYPE` | 不正なコンポーネントタイプ |
| `DANGLING_DATA_SOURCE_REF` | 存在しないDataSource参照 |
| `MISSING_RESOURCE` | `resource`フィールドが欠落 |
| `INVALID_FILTER_OP` | 不正なフィルタ演算子 |
| `INVALID_AGGREGATION_TYPE` | 不正な集計タイプ |

---

## 例

### 完全な例

```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "props": { "columns": 2, "gap": 24 },
    "children": [
      {
        "type": "chart",
        "variant": "bar",
        "title": "Monthly Sales",
        "data_source": "ds_sales"
      },
      {
        "type": "table",
        "title": "Top Products",
        "columns": ["product_name", "total_sales"],
        "data_source": "ds_products",
        "sortable": true
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
      },
      "sort": {
        "field": "month",
        "direction": "asc"
      }
    },
    "ds_products": {
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

---

## バージョニング戦略

- **Semantic Versioning**: MAJOR.MINOR形式
- **破壊的変更**: MAJORバージョンアップ
- **後方互換性**: MINORバージョンアップ
- **非推奨化**: 2バージョン前に警告、削除

詳細は[CHANGELOG.md](../../CHANGELOG.md)を参照してください。
