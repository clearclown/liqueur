# Architecture Overview

このドキュメントでは、Project Liquidの全体アーキテクチャ、設計原則、およびコンポーネント間の相互作用について説明します。

## 目次

1. [設計原則](#設計原則)
2. [3層アーキテクチャ](#3層アーキテクチャ)
3. [データフロー](#データフロー)
4. [コンポーネント構成](#コンポーネント構成)
5. [拡張性戦略](#拡張性戦略)

---

## 設計原則

Project Liquidは、以下の核心原則に基づいて設計されています：

### 1. Security by Design

**AIにはコードを書かせない**

- AIの出力は純粋なJSON Schemaに限定
- 実行可能コード（JavaScript/SQL）は生成させない
- Rust型システムによる厳格な検証（Fail Fast）

```
AI Output (JSON) → Rust Validation → Safe Execution
```

### 2. Separation of Concerns

**3層で責任を明確に分離**

| 層 | 責任 | 技術 |
|---|------|-----|
| Frontend | UI描画、ユーザー対話 | Next.js, React |
| Protocol | インターフェース定義 | JSON Schema |
| Backend | データ取得、検証、権限管理 | Rust, reinhardt-web |

### 3. Type Safety

**TypeScript/Rust両方で型安全性を保証**

- TypeScript: strictモード必須
- Rust: Serde Deserializeで厳密な型チェック
- JSON Schema: 両言語間の契約書

### 4. Least Privilege

**ユーザー権限以上の情報を決して引き出せない**

- Row-Level Security (RLS) 強制
- CurrentUserコンテキストを全クエリに適用
- デフォルトポリシー: `WHERE user_id = current_user.id`

---

## 3層アーキテクチャ

Project LiquidはServer-Driven UI (SDUI) アーキテクチャを採用しています。

### アーキテクチャ図

```
┌─────────────────────────────────────────────────────┐
│         Frontend Layer (Consumer)                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Next.js Application                         │  │
│  │  ├─ AI Chat Interface (Phase 2)              │  │
│  │  ├─ LiquidRenderer (JSON → React)            │  │
│  │  ├─ Chart/Table Components (Recharts)        │  │
│  │  └─ useLiquidView Hook (Data Fetching)       │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTP POST: { schema, data_sources }
                   │ Response: { data: { ds_id: [...] } }
                   │
┌──────────────────▼──────────────────────────────────┐
│         Protocol Layer (Interface)                   │
│  ┌──────────────────────────────────────────────┐  │
│  │  Liquid Protocol (JSON Schema)               │  │
│  │  ├─ LiquidViewSchema                         │  │
│  │  │  ├─ version: "1.0"                        │  │
│  │  │  ├─ layout: Layout                        │  │
│  │  │  └─ data_sources: Record<string, DS>      │  │
│  │  │                                            │  │
│  │  ├─ TypeScript Type Definitions               │  │
│  │  │  └─ SchemaValidator                       │  │
│  │  │                                            │  │
│  │  └─ Rust Serde Structs                       │  │
│  │     └─ SchemaValidator                       │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Validated Schema
                   │
┌──────────────────▼──────────────────────────────────┐
│         Backend Layer (Provider)                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  reinhardt-web Integration                   │  │
│  │  ├─ liquid-reinhardt Adapter                 │  │
│  │  │  ├─ DataSourceConverter                   │  │
│  │  │  │  └─ DataSource → reinhardt-db Query    │  │
│  │  │  │                                         │  │
│  │  │  └─ SecurityEnforcer                      │  │
│  │  │     └─ Row-Level Security Policies        │  │
│  │  │                                            │  │
│  │  └─ reinhardt-db (ORM)                       │  │
│  │     └─ PostgreSQL/MySQL                      │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Layer 1: Frontend (Consumer)

**責任**: UIレンダリング、ユーザーとの対話

**主要コンポーネント**:
- `LiquidRenderer`: JSON SchemaをReactコンポーネントにマッピング
- `ChartComponent`, `TableComponent`: Recharts統合UIコンポーネント
- `useLiquidView`: データフェッチング、エラーハンドリング

**技術スタック**: Next.js 14, React 18, Recharts, Tailwind CSS

### Layer 2: Protocol (Interface)

**責任**: フロントエンドとバックエンド間のインターフェース定義

**主要コンポーネント**:
- `LiquidViewSchema`: UIとデータクエリの完全な定義
- `SchemaValidator` (TS/Rust): スキーマの妥当性検証
- JSON Schema: 両言語間の契約書

**技術スタック**: TypeScript, Rust (Serde), JSON

### Layer 3: Backend (Provider)

**責任**: データ取得、スキーマ検証、権限管理

**主要コンポーネント**:
- `DataSourceConverter`: DataSource → reinhardt-db Query変換
- `SecurityEnforcer`: Row-Level Security適用
- `reinhardt-db`: ORM クエリビルダー

**技術スタック**: Rust, reinhardt-web, PostgreSQL/MySQL

---

## データフロー

### フロー1: 静的JSONからUIレンダリング（Phase 1）

```
1. Developer writes JSON Schema
   └─> { version, layout, data_sources }

2. TypeScript Validation (Frontend)
   └─> SchemaValidator.validate(schema)
   └─> ✅ Valid / ❌ Errors

3. HTTP POST to Backend
   └─> POST /api/liquid-view
   └─> Body: { schema, data_sources: ["ds1", "ds2"] }

4. Rust Validation (Backend)
   └─> serde_json::from_str(schema_json)
   └─> SchemaValidator::validate(&schema)

5. DataSource Conversion
   └─> For each DataSource:
       ├─ converter.convert(data_source)
       │  └─> reinhardt-db Query
       └─ enforcer.enforce(query, current_user)
          └─> Query + RLS Filters

6. Query Execution
   └─> reinhardt-db.execute(query)
   └─> Vec<Row>

7. Response to Frontend
   └─> { data: { "ds1": [...], "ds2": [...] } }

8. React Rendering
   └─> LiquidRenderer receives data
   └─> Maps JSON to React components
   └─> User sees UI
```

### フロー2: AI生成UI（Phase 2）

```
1. User: "旅費を除いた月別経費グラフが見たい"

2. AI (Claude API)
   └─> Generates JSON Schema
   └─> { version: "1.0", layout: {...}, data_sources: {...} }

3. Frontend Validation
   └─> SchemaValidator.validate(schema)
   └─> If invalid: Regenerate

4. [同じフロー続行: Step 3〜8]
```

---

## コンポーネント構成

### TypeScript Components

```
@liqueur/protocol
├─ types/index.ts           # コア型定義
├─ validators/schema.ts     # SchemaValidator
└─ schema/                  # JSON Schema定義

@liqueur/react
├─ components/
│  ├─ LiquidRenderer.tsx    # JSON → React マッピング
│  ├─ ChartComponent.tsx    # Recharts統合
│  └─ TableComponent.tsx    # テーブル表示
├─ layouts/
│  ├─ GridLayout.tsx        # CSS Grid
│  └─ StackLayout.tsx       # Flexbox
└─ hooks/
   └─ useLiquidView.ts      # データフェッチング
```

### Rust Components

```
liquid-protocol (crate)
├─ schema.rs                # Serde構造体
├─ validator.rs             # SchemaValidator
└─ lib.rs

liquid-reinhardt (crate)
├─ converter.rs             # DataSource変換
├─ security.rs              # SecurityEnforcer
└─ lib.rs
```

---

## 拡張性戦略

### 1. 新しいUIコンポーネント追加

**プロトコル拡張のみ**で対応可能：

```typescript
// 1. TypeScript型定義に追加
export type ComponentType = "chart" | "table" | "calendar";  // "calendar"追加

export interface CalendarComponent extends BaseComponent {
  type: "calendar";
  events_data_source?: string;
}

// 2. Rust enumに追加
#[serde(tag = "type")]
pub enum Component {
    Chart { ... },
    Table { ... },
    Calendar { events_data_source: Option<String> },  // 追加
}

// 3. Reactコンポーネント作成
export const CalendarComponent: FC<CalendarComponentProps> = (...) => { ... };

// 4. LiquidRendererに統合
case "calendar": return <CalendarComponent {...props} />;
```

### 2. 新しいフィルタ演算子追加

```typescript
// 1. FilterOperator enumに追加
export type FilterOperator = "eq" | "neq" | ... | "between";

// 2. Converter変換ロジック追加
match filter.op {
    FilterOperator::Between => { ... }
}

// 3. バリデーションテスト追加
it("should validate between operator", () => { ... });
```

### 3. 新しいバックエンド対応

**liquid-fastapi (Python) 例**:

```python
# liquid_fastapi/converter.py
class DataSourceConverter:
    def convert(self, data_source: DataSource) -> SQLAlchemy Query:
        # DataSource → SQLAlchemy変換
        pass

# liquid_fastapi/security.py
class SecurityEnforcer:
    def enforce(self, query, current_user):
        # Row-Level Security適用
        pass
```

プロトコル（JSON Schema）は変更不要！

---

## まとめ

Project Liquidのアーキテクチャは以下の特徴を持ちます：

✅ **Security by Design**: AIはJSON限定、Rust検証で安全性保証
✅ **Separation of Concerns**: 3層で責任明確化
✅ **Type Safety**: TypeScript/Rust両方で型安全性
✅ **Extensibility**: プロトコル拡張のみで新機能追加可能
✅ **Backend Agnostic**: 言語非依存設計

次のステップ:
- [Protocol Specification](protocol-spec.md) - JSON Schema詳細仕様
- [Security Model](security-model.md) - セキュリティ設計詳細
- [Getting Started](../getting-started.md) - 実装チュートリアル
