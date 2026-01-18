# 家計簿アプリ開発ガイド

Project Liquidを使用したAI駆動の家計簿アプリケーション開発指南書

## 目次

1. [概要](#概要)
2. [前提条件](#前提条件)
3. [アーキテクチャ](#アーキテクチャ)
4. [データベース設計](#データベース設計)
5. [実装手順](#実装手順)
6. [AIプロンプト設計](#aiプロンプト設計)
7. [セキュリティ](#セキュリティ)
8. [テスト](#テスト)
9. [デプロイ](#デプロイ)

---

## 概要

### このアプリで実現すること

ユーザーが自然言語で家計を分析できるダッシュボードアプリケーション。

**ユーザーストーリー例**:
- 「今月の食費を円グラフで見せて」
- 「先月と今月の支出を比較して」
- 「カテゴリ別の支出推移を折れ線グラフで」
- 「今月の支出明細を日付順で表示」

### Liquidを使う利点

| 従来の開発 | Liquidを使った開発 |
|-----------|------------------|
| 各ダッシュボードを個別にコーディング | 自然言語からJSON生成 |
| UI変更のたびにデプロイ | リアルタイムでカスタマイズ |
| 固定されたレポート | ユーザーが自由に分析 |

---

## 前提条件

### 必要な技術スタック

```
- Node.js 20+
- PostgreSQL 15+ (または MySQL/SQLite)
- Prisma ORM
- Next.js 14+
- React 18+
- AIプロバイダーのAPIキー
```

### 推奨開発環境

```bash
# Liquidリポジトリをクローン（ベースとして使用）
git clone https://github.com/clearclown/liqueur.git household-budget
cd household-budget

# 依存関係インストール
npm install

# Prisma追加
npm install prisma @prisma/client
npx prisma init
```

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ チャットUI  │  │ダッシュボード│  │ 取引入力    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  API Layer (Next.js API Routes)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │/api/liquid/ │  │/api/transactions│ │/api/auth   │         │
│  │  generate   │  │   CRUD      │  │  JWT        │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Liquid Protocol                                            │
│  • スキーマ検証                                              │
│  • DataSource → Prisma変換                                  │
│  • Row-Level Security適用                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Database (PostgreSQL)                                      │
│  users, transactions, categories, budgets                   │
└─────────────────────────────────────────────────────────────┘
```

---

## データベース設計

### Prismaスキーマ

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ユーザー
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  name         String?
  passwordHash String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  transactions Transaction[]
  categories   Category[]
  budgets      Budget[]
  artifacts    Artifact[]
}

// カテゴリ（支出/収入の分類）
model Category {
  id        String   @id @default(cuid())
  name      String
  type      CategoryType
  icon      String?
  color     String?
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())

  transactions Transaction[]
  budgets      Budget[]

  @@unique([userId, name])
}

enum CategoryType {
  EXPENSE   // 支出
  INCOME    // 収入
}

// 取引（支出/収入の記録）
model Transaction {
  id          String   @id @default(cuid())
  amount      Decimal  @db.Decimal(12, 2)
  type        TransactionType
  description String?
  date        DateTime
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, date])
  @@index([userId, categoryId])
}

enum TransactionType {
  EXPENSE   // 支出
  INCOME    // 収入
}

// 予算
model Budget {
  id         String   @id @default(cuid())
  amount     Decimal  @db.Decimal(12, 2)
  month      DateTime // 月の1日を格納
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  createdAt  DateTime @default(now())

  @@unique([userId, categoryId, month])
}

// 保存されたダッシュボード（Artifact）
model Artifact {
  id        String   @id @default(cuid())
  name      String
  schema    Json     // LiquidViewSchema
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 初期カテゴリ（シード）

```typescript
// prisma/seed.ts

const defaultCategories = [
  // 支出カテゴリ
  { name: '食費', type: 'EXPENSE', icon: '🍽️', color: '#FF6384' },
  { name: '交通費', type: 'EXPENSE', icon: '🚃', color: '#36A2EB' },
  { name: '住居費', type: 'EXPENSE', icon: '🏠', color: '#FFCE56' },
  { name: '光熱費', type: 'EXPENSE', icon: '💡', color: '#4BC0C0' },
  { name: '通信費', type: 'EXPENSE', icon: '📱', color: '#9966FF' },
  { name: '医療費', type: 'EXPENSE', icon: '🏥', color: '#FF9F40' },
  { name: '教育費', type: 'EXPENSE', icon: '📚', color: '#FF6384' },
  { name: '娯楽費', type: 'EXPENSE', icon: '🎮', color: '#C9CBCF' },
  { name: '衣服費', type: 'EXPENSE', icon: '👕', color: '#7C4DFF' },
  { name: 'その他', type: 'EXPENSE', icon: '📦', color: '#607D8B' },

  // 収入カテゴリ
  { name: '給与', type: 'INCOME', icon: '💰', color: '#4CAF50' },
  { name: '副業', type: 'INCOME', icon: '💼', color: '#8BC34A' },
  { name: '投資', type: 'INCOME', icon: '📈', color: '#CDDC39' },
  { name: 'その他収入', type: 'INCOME', icon: '💵', color: '#009688' },
];
```

---

## 実装手順

### Step 1: プロジェクトセットアップ

```bash
# 1. Liquidベースでプロジェクト作成
git clone https://github.com/clearclown/liqueur.git household-budget
cd household-budget

# 2. 依存関係インストール
npm install

# 3. Prisma初期化
npm install prisma @prisma/client
npx prisma init

# 4. 環境変数設定
cp .env.example .env
```

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/household_budget"
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-your-key
JWT_SECRET=your-jwt-secret
```

### Step 2: データベースマイグレーション

```bash
# スキーマをprisma/schema.prismaに記述後
npx prisma migrate dev --name init
npx prisma db seed
```

### Step 3: DatabaseMetadata設定

AIがテーブル構造を理解するためのメタデータを定義します。

```typescript
// lib/database-metadata.ts

import type { DatabaseMetadata } from '@liqueur/protocol';

export const householdBudgetMetadata: DatabaseMetadata = {
  tables: [
    {
      name: 'transactions',
      description: '支出・収入の取引記録',
      columns: [
        { name: 'id', type: 'string', description: '取引ID' },
        { name: 'amount', type: 'decimal', description: '金額（円）' },
        { name: 'type', type: 'string', description: 'EXPENSE（支出）またはINCOME（収入）' },
        { name: 'description', type: 'string', description: '取引の説明' },
        { name: 'date', type: 'date', description: '取引日' },
        { name: 'categoryId', type: 'string', description: 'カテゴリID' },
        { name: 'userId', type: 'string', description: 'ユーザーID' },
      ],
      relations: [
        { name: 'category', target: 'categories', type: 'many-to-one' },
      ],
    },
    {
      name: 'categories',
      description: '支出・収入のカテゴリ',
      columns: [
        { name: 'id', type: 'string', description: 'カテゴリID' },
        { name: 'name', type: 'string', description: 'カテゴリ名（食費、交通費など）' },
        { name: 'type', type: 'string', description: 'EXPENSE（支出）またはINCOME（収入）' },
        { name: 'icon', type: 'string', description: '絵文字アイコン' },
        { name: 'color', type: 'string', description: '表示色（HEX）' },
      ],
    },
    {
      name: 'budgets',
      description: 'カテゴリ別の月間予算',
      columns: [
        { name: 'id', type: 'string', description: '予算ID' },
        { name: 'amount', type: 'decimal', description: '予算額（円）' },
        { name: 'month', type: 'date', description: '対象月' },
        { name: 'categoryId', type: 'string', description: 'カテゴリID' },
      ],
    },
  ],

  // AIへのヒント
  hints: [
    '金額は日本円（JPY）で表示してください',
    'カテゴリ別の集計には category.name を使用してください',
    '月別の集計には date フィールドを month でグループ化してください',
    '支出のみを表示する場合は type = "EXPENSE" でフィルタしてください',
    '収入のみを表示する場合は type = "INCOME" でフィルタしてください',
  ],
};
```

### Step 4: API実装

```typescript
// app/api/liquid/generate/route.ts

import { NextResponse } from 'next/server';
import { ProviderFactory } from '@liqueur/ai-provider';
import { SchemaValidator } from '@liqueur/protocol';
import { householdBudgetMetadata } from '@/lib/database-metadata';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // 認証チェック
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await request.json();

    // AIプロバイダー取得
    const provider = ProviderFactory.create();

    // スキーマ生成
    const schema = await provider.generateSchema({
      prompt,
      metadata: householdBudgetMetadata,
      context: {
        currentDate: new Date().toISOString(),
        userId: user.id,
      },
    });

    // スキーマ検証
    const validator = new SchemaValidator();
    const result = validator.validate(schema);

    if (!result.valid) {
      return NextResponse.json(
        { error: 'Invalid schema', details: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ schema });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}
```

### Step 5: DataSource実行

```typescript
// lib/execute-datasource.ts

import { PrismaClient } from '@prisma/client';
import type { DataSource } from '@liqueur/protocol';

const prisma = new PrismaClient();

export async function executeDataSource(
  dataSource: DataSource,
  userId: string
): Promise<any[]> {
  const { resource, filters = [], aggregation, sort, limit } = dataSource;

  // Row-Level Security: 必ずuserIdでフィルタ
  const where: any = { userId };

  // フィルタ変換
  for (const filter of filters) {
    where[filter.field] = convertOperator(filter.op, filter.value);
  }

  // クエリ実行
  if (aggregation) {
    return executeAggregation(resource, where, aggregation, sort, limit);
  }

  return prisma[resource].findMany({
    where,
    orderBy: sort ? { [sort.field]: sort.direction } : undefined,
    take: limit,
    include: getIncludes(resource),
  });
}

function convertOperator(op: string, value: any) {
  switch (op) {
    case 'eq': return value;
    case 'neq': return { not: value };
    case 'gt': return { gt: value };
    case 'gte': return { gte: value };
    case 'lt': return { lt: value };
    case 'lte': return { lte: value };
    case 'in': return { in: value };
    case 'contains': return { contains: value };
    default: return value;
  }
}

async function executeAggregation(
  resource: string,
  where: any,
  aggregation: any,
  sort: any,
  limit: number
) {
  const { type, field, by } = aggregation;

  const result = await prisma[resource].groupBy({
    by: [by],
    where,
    _sum: type === 'sum' ? { [field]: true } : undefined,
    _avg: type === 'avg' ? { [field]: true } : undefined,
    _count: type === 'count' ? { [field]: true } : undefined,
    _min: type === 'min' ? { [field]: true } : undefined,
    _max: type === 'max' ? { [field]: true } : undefined,
    orderBy: sort ? { [sort.field]: sort.direction } : undefined,
    take: limit,
  });

  // 結果を正規化
  return result.map((row: any) => ({
    [by]: row[by],
    [`${field}_${type}`]: row[`_${type}`]?.[field] || row._count?.[field],
  }));
}

function getIncludes(resource: string) {
  if (resource === 'transactions') {
    return { category: true };
  }
  return undefined;
}
```

### Step 6: フロントエンド実装

```tsx
// app/dashboard/page.tsx

'use client';

import { useState } from 'react';
import { LiquidRenderer } from '@liqueur/react';
import type { LiquidViewSchema } from '@liqueur/protocol';

export default function DashboardPage() {
  const [prompt, setPrompt] = useState('');
  const [schema, setSchema] = useState<LiquidViewSchema | null>(null);
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. スキーマ生成
      const genRes = await fetch('/api/liquid/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!genRes.ok) {
        throw new Error('Schema generation failed');
      }

      const { schema: newSchema } = await genRes.json();
      setSchema(newSchema);

      // 2. データ取得
      const dataRes = await fetch('/api/liquid/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSources: newSchema.data_sources }),
      });

      if (!dataRes.ok) {
        throw new Error('Data fetch failed');
      }

      const { data: newData } = await dataRes.json();
      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">家計簿ダッシュボード</h1>

      {/* プロンプト入力 */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例: 今月のカテゴリ別支出を円グラフで表示"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? '生成中...' : '生成'}
          </button>
        </div>

        {/* サンプルプロンプト */}
        <div className="mt-2 flex gap-2 flex-wrap">
          {[
            '今月の支出を円グラフで',
            '月別の支出推移を折れ線グラフで',
            '今月の支出明細を表で',
            '食費と交通費を比較',
          ].map((sample) => (
            <button
              key={sample}
              onClick={() => setPrompt(sample)}
              className="text-sm px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* ダッシュボード表示 */}
      {schema && (
        <LiquidRenderer
          schema={schema}
          data={data}
          loading={loading}
        />
      )}
    </div>
  );
}
```

---

## AIプロンプト設計

### システムプロンプト

```typescript
// lib/system-prompt.ts

export const householdBudgetSystemPrompt = `
あなたは家計簿アプリのダッシュボード生成AIです。
ユーザーの自然言語リクエストから、LiquidViewSchemaを生成してください。

## 利用可能なテーブル

### transactions（取引）
- amount: 金額（円）
- type: EXPENSE（支出）/ INCOME（収入）
- date: 取引日
- categoryId: カテゴリID
- description: 説明

### categories（カテゴリ）
- name: カテゴリ名
- type: EXPENSE / INCOME
- icon: 絵文字
- color: 色コード

### budgets（予算）
- amount: 予算額
- month: 対象月
- categoryId: カテゴリID

## ルール

1. 金額は日本円で表示
2. 支出分析の場合は type="EXPENSE" でフィルタ
3. カテゴリ別集計は category.name でグループ化
4. 月別集計は date を month でグループ化
5. グラフタイプ:
   - 構成比 → pie（円グラフ）
   - 推移 → line（折れ線）
   - 比較 → bar（棒グラフ）
   - 一覧 → table（テーブル）

## 出力形式

LiquidViewSchema（JSON）のみを出力してください。
`;
```

### プロンプト例と期待される出力

#### 例1: 「今月のカテゴリ別支出を円グラフで」

```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "columns": 1
  },
  "components": [
    {
      "type": "chart",
      "variant": "pie",
      "title": "今月のカテゴリ別支出",
      "data_source": "ds_category_expenses"
    }
  ],
  "data_sources": {
    "ds_category_expenses": {
      "resource": "transactions",
      "filters": [
        { "field": "type", "op": "eq", "value": "EXPENSE" },
        { "field": "date", "op": "gte", "value": "2026-01-01" },
        { "field": "date", "op": "lt", "value": "2026-02-01" }
      ],
      "aggregation": {
        "type": "sum",
        "field": "amount",
        "by": "category.name"
      }
    }
  }
}
```

#### 例2: 「月別の支出推移を折れ線グラフで」

```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "columns": 1
  },
  "components": [
    {
      "type": "chart",
      "variant": "line",
      "title": "月別支出推移",
      "data_source": "ds_monthly_expenses",
      "x_axis": "month",
      "y_axis": "amount_sum"
    }
  ],
  "data_sources": {
    "ds_monthly_expenses": {
      "resource": "transactions",
      "filters": [
        { "field": "type", "op": "eq", "value": "EXPENSE" }
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
}
```

#### 例3: 「今月の支出明細を日付順で表示」

```json
{
  "version": "1.0",
  "layout": {
    "type": "grid",
    "columns": 1
  },
  "components": [
    {
      "type": "table",
      "title": "今月の支出明細",
      "data_source": "ds_transactions",
      "columns": [
        { "field": "date", "header": "日付" },
        { "field": "category.name", "header": "カテゴリ" },
        { "field": "description", "header": "内容" },
        { "field": "amount", "header": "金額" }
      ]
    }
  ],
  "data_sources": {
    "ds_transactions": {
      "resource": "transactions",
      "filters": [
        { "field": "type", "op": "eq", "value": "EXPENSE" },
        { "field": "date", "op": "gte", "value": "2026-01-01" },
        { "field": "date", "op": "lt", "value": "2026-02-01" }
      ],
      "sort": {
        "field": "date",
        "direction": "desc"
      }
    }
  }
}
```

---

## セキュリティ

### 1. Row-Level Security

**すべてのクエリにuserIdフィルタを強制**:

```typescript
// 絶対にスキップしない
async function executeDataSource(dataSource: DataSource, userId: string) {
  const where = { userId }; // 必ず最初に設定
  // ...
}
```

### 2. 入力検証

```typescript
// プロンプトのサニタイズ
function sanitizePrompt(prompt: string): string {
  // 最大長制限
  if (prompt.length > 500) {
    throw new Error('Prompt too long');
  }

  // 危険なパターン検出
  const dangerousPatterns = [
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /<script>/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(prompt)) {
      throw new Error('Invalid prompt');
    }
  }

  return prompt.trim();
}
```

### 3. レート制限

```typescript
// 1分間に10リクエストまで
const rateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  max: 10,
});
```

### 4. 認証

```typescript
// JWT認証ミドルウェア
import { JWTProvider } from '@liqueur/auth';

const jwtProvider = new JWTProvider({
  secret: process.env.JWT_SECRET!,
});

export async function getCurrentUser(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  try {
    return await jwtProvider.verify(token);
  } catch {
    return null;
  }
}
```

---

## テスト

### ユニットテスト

```typescript
// __tests__/execute-datasource.test.ts

import { executeDataSource } from '@/lib/execute-datasource';

describe('executeDataSource', () => {
  it('should always filter by userId', async () => {
    const dataSource = {
      resource: 'transactions',
      filters: [],
    };

    // 別ユーザーのデータが含まれないことを確認
    const result = await executeDataSource(dataSource, 'user-1');

    for (const row of result) {
      expect(row.userId).toBe('user-1');
    }
  });

  it('should apply aggregation correctly', async () => {
    const dataSource = {
      resource: 'transactions',
      filters: [{ field: 'type', op: 'eq', value: 'EXPENSE' }],
      aggregation: { type: 'sum', field: 'amount', by: 'categoryId' },
    };

    const result = await executeDataSource(dataSource, 'user-1');

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toHaveProperty('amount_sum');
  });
});
```

### E2Eテスト

```typescript
// e2e/dashboard.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
  });

  test('should generate pie chart from prompt', async ({ page }) => {
    await page.goto('/dashboard');

    // プロンプト入力
    await page.fill('input[placeholder*="例"]', '今月の支出を円グラフで');
    await page.click('button:has-text("生成")');

    // チャート表示を待機
    await expect(page.locator('.recharts-pie')).toBeVisible({ timeout: 30000 });
  });

  test('should generate table from prompt', async ({ page }) => {
    await page.goto('/dashboard');

    await page.fill('input[placeholder*="例"]', '今月の支出明細を表で');
    await page.click('button:has-text("生成")');

    await expect(page.locator('table')).toBeVisible({ timeout: 30000 });
  });
});
```

---

## デプロイ

### Vercel（推奨）

```bash
# 1. Vercel CLIインストール
npm i -g vercel

# 2. デプロイ
vercel

# 3. 環境変数設定（Vercelダッシュボードで）
# DATABASE_URL, AI_PROVIDER, DEEPSEEK_API_KEY, JWT_SECRET
```

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/household_budget
      - AI_PROVIDER=deepseek
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=household_budget
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## チェックリスト

### 開発開始前
- [ ] Node.js 20+インストール
- [ ] PostgreSQLセットアップ
- [ ] AIプロバイダーAPIキー取得
- [ ] Liquidリポジトリクローン

### 実装
- [ ] Prismaスキーマ作成
- [ ] マイグレーション実行
- [ ] シードデータ投入
- [ ] DatabaseMetadata定義
- [ ] API実装（generate, execute）
- [ ] フロントエンド実装

### テスト
- [ ] ユニットテスト作成
- [ ] E2Eテスト作成
- [ ] RLSテスト（他ユーザーデータにアクセスできないこと）

### デプロイ
- [ ] 環境変数設定
- [ ] 本番データベース準備
- [ ] デプロイ実行
- [ ] 動作確認

---

## 参考リンク

- [Project Liquid GitHub](https://github.com/clearclown/liqueur)
- [Liquid Philosophy](../philosophy/why-liquid.md)
- [Liquid Concepts](../tutorials/concepts.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

## サポート

質問や問題があれば、[GitHub Issues](https://github.com/clearclown/liqueur/issues)で報告してください。
