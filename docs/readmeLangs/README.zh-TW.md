<div align="center">

# Liquid Protocol

**用自然語言自由定製儀表板。**

AI驅動UI生成的開源協議

[![npm](https://img.shields.io/npm/v/@liqueur/protocol?style=flat-square&color=blue)](https://www.npmjs.com/package/@liqueur/protocol)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](../../LICENSE)

[English](../../README.md) | [日本語](./README.ja.md) | [简体中文](./README.zh-CN.md) | 繁體中文 | [Русский](./README.ru.md) | [Українська](./README.uk.md) | [فارسی](./README.fa.md) | [العربية](./README.ar.md)

</div>

---

## 簡而言之

**「排除交通費，用長條圖顯示每月支出」**

只需說這句話，儀表板就會自動重新配置。

<div align="center">

| 之前 | 之後 |
|------|------|
| ![初始儀表板](../images/dashboard-initial.png) | ![AI更新後](../images/dashboard-after-ai.png) |
| 預設儀表板 | 說「排除交通費」之後 |

</div>

---

## 30秒快速開始

```bash
npx create-next-liqueur-app my-dashboard
cd my-dashboard
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)，開始對話即可。

---

## 目錄

- [為什麼選擇 Liquid Protocol？](#為什麼選擇-liquid-protocol)
- [與 Claude Artifacts / Gemini Canvas 的區別](#與-claude-artifacts--gemini-canvas-的區別)
- [應用場景](#應用場景)
- [工作原理](#工作原理)
- [安裝](#安裝)
- [開發者設定](#開發者設定)
- [安全設計](#安全設計)
- [Schema 規範](#schema-規範)
- [路線圖](#路線圖)

---

## 為什麼選擇 Liquid Protocol？

### 定製化的兩難困境

以記帳應用為例。無論使用哪個應用，你總會有這樣的需求：

> - 「排除交通費 - 公司會報銷」
> - 「家庭卡消費要分開 - 會得到退款」
> - 「給旅行期間的消費加上『旅行』標籤」
> - 「我不喜歡紅色 - 換成藍色和黑色」

**現有解決方案：**

| 方式 | 範例 | 問題 |
|:----|:-----|:-----|
| 自己全部建構 | Notion, 電子表格 | 定製成為目的，偏離正軌 |
| 增加設定項 | 傳統應用 | 設定介面變得複雜。「太自由反而不自由」 |

### Liquid 的解決方案

**只需說出你想要的。**

```
使用者: 「排除交通費」
    ↓
AI 重新生成儀表板結構
    ↓
篩選器、圖表、佈局自動更新
```

不再需要在設定介面中四處尋找。

---

## 與 Claude Artifacts / Gemini Canvas 的區別

你用過 [Claude Artifacts](https://support.anthropic.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them) 或 [Gemini Canvas](https://gemini.google/overview/canvas/) 嗎？

它們是很棒的功能，可以透過AI對話生成儀表板和程式碼。

**Liquid Protocol 將這種體驗帶到你自己的應用中。**

| 功能 | Claude Artifacts | Gemini Canvas | **Liquid Protocol** |
|------|:---------------:|:-------------:|:-------------------:|
| AI驅動的UI生成 | ✅ | ✅ | ✅ |
| 嵌入自己的應用 | ❌ | ❌ | **✅** |
| 連接自己的資料庫 | ❌ | ❌ | **✅** |
| 行級安全 | ❌ | ❌ | **✅** |
| 程式碼執行風險 | ⚠️ 沙箱 | ⚠️ 沙箱 | **✅ 無** |
| 開源 | ❌ | ❌ | **✅ MIT** |
| AI提供商選擇 | 僅Claude | 僅Gemini | **任意** |

### 總結

```
Claude Artifacts / Gemini Canvas
  → 很棒。但只在他們的應用中。

Liquid Protocol
  → 在你自己的應用中實現同樣的體驗。
    你的資料庫，你的使用者。
```

---

## 應用場景

我們用記帳應用來演示，但這項技術適用於任何應用：

| 應用 | 傳統問題 | Liquid 解決方案 |
|:----|:--------|:---------------|
| **Slack / Discord** | 通知設定複雜 | 「只通知重要對話」 |
| **股票交易** | 儀表板固定 | 「只用圓餅圖顯示科技股」 |
| **Twitter / SNS** | 演算法不透明 | 「隱藏政治內容」 |
| **專案管理** | Jira 設定地獄 | 「只顯示本週我的任務」 |

**這項技術將成為軟體標準。**

---

## 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│  使用者: 「排除交通費，用長條圖顯示」                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AI (Claude / GPT / Gemini / DeepSeek / GLM)                │
│                                                             │
│  ⚠️ 僅輸出 JSON schema。不生成 JS/SQL                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  @liqueur/protocol                                          │
│                                                             │
│  ✅ Schema 驗證: 未知欄位立即拒絕                            │
│  ✅ TypeScript + Rust 雙重驗證                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  @liqueur/db-adapter                                        │
│                                                             │
│  🔒 行級安全                                                │
│  🔒 SQL注入防護                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  @liqueur/react                                             │
│                                                             │
│  📊 自動渲染圖表、表格和佈局                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 安裝

### 按用途

```bash
# 僅 Schema 定義
npm install @liqueur/protocol

# 新增 React UI
npm install @liqueur/protocol @liqueur/react

# 全端 (AI + 資料庫)
npm install @liqueur/protocol @liqueur/react @liqueur/ai-provider @liqueur/db-adapter
```

### 套件列表

| 套件 | 用途 |
|:----|:-----|
| [@liqueur/protocol](https://www.npmjs.com/package/@liqueur/protocol) | Schema 類型 & 驗證 |
| [@liqueur/react](https://www.npmjs.com/package/@liqueur/react) | UI 元件 |
| [@liqueur/ai-provider](https://www.npmjs.com/package/@liqueur/ai-provider) | AI 提供商整合 |
| [@liqueur/db-adapter](https://www.npmjs.com/package/@liqueur/db-adapter) | Prisma 查詢執行 |
| [@liqueur/artifact-store](https://www.npmjs.com/package/@liqueur/artifact-store) | Schema 持久化 |
| [create-next-liqueur-app](https://www.npmjs.com/package/create-next-liqueur-app) | 專案腳手架 CLI |

---

## 開發者設定

### 方式1: CLI 快速開始

```bash
npx create-next-liqueur-app my-dashboard
cd my-dashboard

# 設定 AI 提供商
cp .env.example .env
# 編輯 .env 新增 API key

npm run dev
```

### 方式2: 新增到現有專案

```bash
npm install @liqueur/protocol @liqueur/react @liqueur/ai-provider
```

### 環境變數

使用 `@liqueur/ai-provider` 時，為選擇的 AI 提供商設定環境變數：

```bash
# .env 或 .env.local

# 選擇提供商: anthropic, openai, gemini, deepseek, glm, local
AI_PROVIDER=anthropic

# ─── Anthropic (Claude) ───────────────────────────────
ANTHROPIC_API_KEY=sk-ant-your-key
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
# 模型: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus-20240229

# ─── OpenAI (GPT) ─────────────────────────────────────
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
# 模型: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo

# ─── Google Gemini ────────────────────────────────────
GOOGLE_API_KEY=your-key
GEMINI_MODEL=gemini-1.5-flash
# 模型: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash

# ─── DeepSeek ─────────────────────────────────────────
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_MODEL=deepseek-chat
# 模型: deepseek-chat, deepseek-coder

# ─── GLM (智譜 AI) ────────────────────────────────────
GLM_API_KEY=your-key
GLM_MODEL=glm-4
# 模型: glm-4, glm-4-flash, glm-3-turbo

# ─── Local LLM (Ollama, LM Studio) ────────────────────
LOCAL_LLM_BASE_URL=http://localhost:1234/v1
LOCAL_LLM_MODEL=llama3
```

### 基本用法

```typescript
import { ProviderFactory } from '@liqueur/ai-provider';
import { LiquidRenderer } from '@liqueur/react';

// 從環境變數建立 Provider
const provider = ProviderFactory.createFromEnv();

// 從自然語言生成 Schema
const schema = await provider.generateSchema(
  "用長條圖顯示每月支出",
  databaseMetadata
);

// 渲染儀表板
<LiquidRenderer schema={schema} data={data} />
```

### 範例：Next.js API Route

```typescript
// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProviderFactory } from '@liqueur/ai-provider';

export async function POST(request: NextRequest) {
  const { prompt } = await request.json();

  const provider = ProviderFactory.createFromEnv();
  const schema = await provider.generateSchema(prompt, metadata);

  return NextResponse.json({ schema });
}
```

### 範例應用

| 範例 | 說明 | 執行 |
|:----|:-----|:----|
| [家計簿應用](../../examples/household-budget) | 具備 AI 聊天的完整功能 | `cd examples/household-budget && pnpm dev` |
| [Playground](../../examples/playground) | 簡單測試環境 | `cd examples/playground && pnpm dev` |

### 從原始碼執行

```bash
git clone https://github.com/clearclown/liqueur.git
cd liqueur
pnpm install && pnpm build

cd examples/household-budget
cp .env.example .env  # 設定 API 金鑰
pnpm dev
```

---

## 安全設計

### 為什麼不讓 AI 寫 JavaScript？

| 方式 | 風險 |
|:----|:-----|
| AI 生成 JS/SQL | XSS、SQL注入、任意程式碼執行 |
| **Liquid: 僅 JSON** | 無可執行程式碼。未知欄位被拒絕 |

### 三層防禦

1. **AI 輸出限制** — 僅 JSON schema。不生成程式碼
2. **Schema 驗證** — 未知欄位立即拒絕（Fail Fast）
3. **行級安全** — 使用者只能存取自己的資料

---

## 路線圖

- [x] Phase 1: 核心協議 & React 元件
- [x] Phase 2: AI 提供商整合
- [x] Phase 3: 範例應用（記帳）
- [ ] Phase 4: 新增元件（日曆、地圖等）
- [ ] Phase 5: 即時協作編輯
- [ ] Phase 6: 外掛系統

---

## 授權條款

[MIT](../../LICENSE)

---

<div align="center">

**Liquid Protocol**

終結使用者與設定搏鬥的時代

[GitHub](https://github.com/clearclown/liqueur) · [npm](https://www.npmjs.com/package/@liqueur/protocol)

</div>
