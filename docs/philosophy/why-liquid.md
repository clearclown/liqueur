# Why Liquid? - AIとUIの新しいパラダイム

## はじめに：なぜ今、Liquidが必要なのか

ソフトウェアの歴史は「抽象化」と「自動化」の歴史です。アセンブリからC、Cからオブジェクト指向、そしてフレームワークへ。しかし、**User Interface（UI）の構築**に関しては、この20年間、本質的なパラダイムは変わっていませんでした。

LLM（大規模言語モデル）の登場により、ついにこのパラダイムが変わろうとしています。

---

## パラダイムシフト：Static SaaSからLiquid SaaSへ

### これまで（Static SaaS）

開発者が想定したユースケースに基づき、**固定された画面**、**固定された機能**、**固定されたワークフロー**をユーザーに提供してきました。

「カスタマイズ」と呼ばれるものは、開発者が用意した無数のチェックボックスをオン・オフすることに過ぎませんでした。

```
ユーザーの要求: 「旅費を除いた経費推移が見たい」

従来の対応:
  1. 機能リクエストとしてBacklogに積む
  2. 開発チームがスプリントで実装
  3. 2-4週間後にリリース
  4. ユーザーが本当に欲しかったものと微妙に違う
```

### これから（Liquid SaaS）

AIの台頭により、ソフトウェアはユーザーの**コンテキスト（Context）**と**意図（Intent）**に合わせて、実行時にその姿を**液体のように変化**させることが可能になります。

```
ユーザーの要求: 「旅費を除いた経費推移が見たい」

Liquidの対応:
  1. AIが自然言語を解析
  2. JSONスキーマを即座に生成
  3. UIが動的にレンダリング
  4. 数秒で完成
```

ユーザーは「機能を使う」のではなく、**「目的を伝える」だけ**で良くなります。

---

## 画期的な点：AIにコードを書かせない

### 従来のAI UI生成の致命的な問題

Vercel v0やGPT Engineerなどの「AI UI生成」ツールは、AIにJavaScriptやSQLを直接生成させます。これには深刻な問題があります：

```javascript
// AIが生成したコード（危険な例 - 実際には使用しないでください）
// 1. SQLインジェクションの脆弱性
const query = `SELECT * FROM users WHERE id = '${userInput}'`;

// 2. XSSの脆弱性（DOM操作の不適切な使用）
// 3. 任意コード実行の脆弱性
```

**問題点**：
- ❌ **セキュリティ脆弱性**: XSS、SQLインジェクション、任意コード実行
- ❌ **ハルシネーション**: AIが存在しないAPIやテーブルを参照
- ❌ **再現性の欠如**: 同じプロンプトでも毎回異なるコードが生成
- ❌ **メンテナンス不可能**: 生成されたコードの品質保証ができない

### Liquidのアプローチ：制約による自由

私たちの哲学は**「AIにはコードを書かせない」**ことです。

```
従来:
  User → AI → JavaScript/SQL生成 → 実行 → 脆弱性のリスク

Liquid:
  User → AI → JSONスキーマ → Rust型検証 → 安全なORM → 安全に実行
```

AIが生成できるのは**JSONスキーマのみ**。このスキーマはRustの厳格な型システムによって検証され、**定義外のフィールドは即座にエラー**となります。

```rust
// Rustの型定義（Serde）
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]  // 未知のフィールドを拒否
pub struct LiquidViewSchema {
    pub version: String,
    pub components: Vec<Component>,
    pub data_sources: HashMap<String, DataSource>,
}
```

**「何でもできる自由」ではなく、「定義された安全なパーツを自由に組み合わせられる自由」を提供します。**

---

## Artifact中心モデル

### Artifactとは何か

私たちは、AIが生成するものを単なる「テキスト」や「チャット」として扱いません。

ClaudeのArtifactやGeminiのCanvasが示したように、AIの出力は**「編集可能で、実行可能で、永続的な構造化データ（Artifact）」**であるべきです。

このフレームワークにおいて、ダッシュボードの一つ一つ、レポートの一つ一つが**Artifact**です。

### Artifactの本質

**Artifactはコードではなく、意図の純粋な定義（Schema）です。**

```json
{
  "version": "1.0",
  "components": [
    {
      "type": "chart",
      "variant": "bar",
      "title": "月別支出（旅費除く）",
      "data_source": "ds_expenses"
    }
  ],
  "data_sources": {
    "ds_expenses": {
      "resource": "expenses",
      "filters": [
        { "field": "category", "op": "neq", "value": "travel" }
      ],
      "aggregation": {
        "type": "sum",
        "field": "amount",
        "by": "month"
      }
    }
  }
}
```

このJSONには「何を表示したいか」という**意図**のみが記述されています。
- どのDBエンジンを使うか
- どのようにSQLを組み立てるか
- どのチャートライブラリを使うか

これらの**実装詳細は含まれていません**。だからこそ、バックエンドの言語を問わず、フロントエンドのフレームワークを問わず、再利用可能なのです。

---

## 三層アーキテクチャ：関心の分離

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Frontend (React/Next.js)                       │
│                                                         │
│   責務: ユーザーインタラクション、JSONのレンダリング     │
│   知らないこと: データの取得方法、セキュリティルール     │
└──────────────────────────────────────────────────────────┘
                        │
                        │ JSON Schema (Artifact)
                        ▼
┌──────────────────────────────────────────────────────────┐
│ Layer 2: Protocol (liquid-protocol)                      │
│                                                          │
│   責務: スキーマ定義、型検証、言語間の契約              │
│   実装: TypeScript + Rust（同一仕様を両言語で定義）      │
└──────────────────────────────────────────────────────────┘
                        │
                        │ Validated Schema
                        ▼
┌──────────────────────────────────────────────────────────┐
│ Layer 3: Backend (Rust/reinhardt-web)                    │
│                                                          │
│   責務: クエリ実行、Row-Level Security、データ取得       │
│   保証: ユーザー権限を超えたデータには決してアクセス不可 │
└──────────────────────────────────────────────────────────┘
```

### なぜ三層か

**Single Responsibility Principle（単一責任原則）**を徹底することで：

1. **フロントエンドの開発者**はUIのみに集中できる
2. **バックエンドの開発者**はセキュリティとデータアクセスに集中できる
3. **AIは安全な範囲内で最大限の創造性を発揮できる**

---

## Row-Level Security：デフォルトで安全

### 最小権限の原則

Liquidでは、**すべてのクエリにRow-Level Security（RLS）が強制適用**されます。

```rust
// 全クエリに自動適用
pub fn apply_rls(query: Query, user: &CurrentUser) -> Query {
    match user.role {
        Role::Admin => query,  // 管理者のみ全データアクセス可
        _ => query.where_clause(format!("user_id = {}", user.id))
    }
}
```

これは**オプトアウトできません**。開発者が意図的にセキュリティホールを作ることを防ぎます。

### なぜこれが画期的か

従来のシステムでは、セキュリティは「追加する」ものでした。Liquidでは、セキュリティは**「削除する」ことでしか無効にできない**ものです。

```rust
// Liquid: セキュリティはデフォルト、削除しない限り適用
pub fn get_expenses(schema: &DataSource, user: &CurrentUser) -> Query {
    let query = build_query(schema);
    apply_rls(query, user)  // 常に適用
}
```

---

## Developer Experience：開発者も幸せに

「ユーザーが自由に画面を作れる」ことは、開発者が苦労することを意味してはなりません。

### Backend Agnostic

既存のRust、Python、Goのバックエンド資産をそのまま活かせます。新しいORMを学ぶ必要はありません。

```rust
// 既存のreinhardtコードをそのまま活用
let query = reinhardt::Query::new("expenses")
    .filter(schema.filters)
    .aggregate(schema.aggregation);
```

### Protocol Oriented

言語間の壁をJSON Schemaという共通言語で取り払います。

```
TypeScript (Frontend) ─┐
                       ├─→ JSON Schema ←─┤ Rust (Backend)
Python (AI Provider) ──┘                 │
                                         │
同じスキーマを、どの言語でも読み書きできる
```

### TDD First

95%以上のテストカバレッジを必須とし、品質を保証します。

```bash
# TypeScript: 271テスト
npm test

# Rust: 25テスト
cargo test --workspace

# 合計: 296テスト、95%+ カバレッジ
```

---

## まとめ：Liquidが目指す世界

私たちは、AI時代の**「Django」や「Rails」**を作ろうとしています。

それは、AIと人間が**共創**するための、**最も安全**で**高速**な基盤です。

### 三つの約束

1. **安全性**: AIにコードを書かせない。スキーマのみで実行。
2. **自由度**: 定義された安全なパーツを自由に組み合わせられる。
3. **拡張性**: Protocol拡張のみで新しいコンポーネントを追加できる。

### 最後に

> ソフトウェアは、ユーザーの意図を実現するための道具であるべきです。
>
> 固定されたメニューから選ぶのではなく、
> 「こうしたい」と伝えるだけで、形になる。
>
> それがLiquid Architectureの目指す世界です。

---

**次へ**: [クイックスタート](../tutorials/quickstart.md) | [コア概念](../tutorials/concepts.md)
