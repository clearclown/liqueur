<div align="center">

# Liquid Protocol

**Transform dashboards with natural language.**

Open-source protocol for AI-driven UI generation

[![npm](https://img.shields.io/npm/v/@liqueur/protocol?style=flat-square&color=blue)](https://www.npmjs.com/package/@liqueur/protocol)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

English | [日本語](./docs/readmeLangs/README.ja.md) | [简体中文](./docs/readmeLangs/README.zh-CN.md) | [繁體中文](./docs/readmeLangs/README.zh-TW.md) | [Русский](./docs/readmeLangs/README.ru.md) | [Українська](./docs/readmeLangs/README.uk.md) | [فارسی](./docs/readmeLangs/README.fa.md) | [العربية](./docs/readmeLangs/README.ar.md)

</div>

---

## In a Nutshell

**"Exclude transportation costs and show monthly expenses as a bar chart"**

Just say this, and your dashboard automatically reconfigures itself.

<div align="center">

| Before | After |
|--------|-------|
| ![Initial Dashboard](docs/images/dashboard-initial.png) | ![After AI Update](docs/images/dashboard-after-ai.png) |
| Default dashboard | After saying "Exclude transportation" |

</div>

---

## Quick Start (30 seconds)

```bash
npx create-next-liqueur-app my-dashboard
cd my-dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting.

---

## Table of Contents

- [Why Liquid Protocol?](#why-liquid-protocol)
- [Comparison with Claude Artifacts / Gemini Canvas](#comparison-with-claude-artifacts--gemini-canvas)
- [Use Cases](#use-cases)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Developer Setup](#developer-setup)
- [Security Design](#security-design)
- [Schema Specification](#schema-specification)
- [Roadmap](#roadmap)

---

## Why Liquid Protocol?

### The Customization Dilemma

Consider a budget tracking app. No matter which app you use, you'll always have requests like:

> - "Exclude transportation costs - my company reimburses those"
> - "Family card purchases should be separate - I get reimbursed"
> - "Tag all spending during my trip as 'travel'"
> - "I hate red - make it blue and black"

**Current solutions:**

| Approach | Example | Problem |
|:---------|:--------|:--------|
| Build everything yourself | Notion, Spreadsheets | Customization becomes the goal. You lose focus |
| Add more settings | Traditional apps | Settings screens become complex. "Too much freedom" |

### Liquid's Solution

**Just say what you want.**

```
User: "Exclude transportation costs"
    ↓
AI regenerates the dashboard structure
    ↓
Filters, charts, and layouts update automatically
```

No more hunting through settings screens.

---

## Comparison with Claude Artifacts / Gemini Canvas

Have you used [Claude Artifacts](https://support.anthropic.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them) or [Gemini Canvas](https://gemini.google/overview/canvas/)?

They're amazing features that let you generate dashboards and code through AI conversations.

**Liquid Protocol brings this experience to YOUR app.**

| Feature | Claude Artifacts | Gemini Canvas | **Liquid Protocol** |
|---------|:---------------:|:-------------:|:-------------------:|
| AI-powered UI generation | ✅ | ✅ | ✅ |
| Embed in your own app | ❌ | ❌ | **✅** |
| Connect your own database | ❌ | ❌ | **✅** |
| Row-Level Security | ❌ | ❌ | **✅** |
| Code execution risk | ⚠️ Sandboxed | ⚠️ Sandboxed | **✅ None** |
| Open Source | ❌ | ❌ | **✅ MIT** |
| AI provider choice | Claude only | Gemini only | **Any** |

### In Summary

```
Claude Artifacts / Gemini Canvas
  → Amazing. But only within THEIR apps.

Liquid Protocol
  → The same experience in YOUR app.
    Your database, your users.
```

---

## Use Cases

We're demonstrating with a budget app, but this technology applies to any application:

| Application | Traditional Problem | Liquid Solution |
|:------------|:-------------------|:----------------|
| **Slack / Discord** | Complex notification settings | "Only notify me for important conversations" |
| **Stock Trading** | Fixed dashboards | "Show only tech stocks in a pie chart" |
| **Twitter / SNS** | Opaque algorithm | "Hide political content" |
| **Project Management** | Jira settings hell | "Show only my tasks this week" |

**This technology will become the software standard.**

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  User: "Exclude transportation, show as bar chart"          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AI (Claude / GPT / Gemini / DeepSeek / GLM)                │
│                                                             │
│  ⚠️ Outputs JSON schema ONLY. No JS/SQL generation          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  @liqueur/protocol                                          │
│                                                             │
│  ✅ Schema validation: Unknown fields rejected immediately  │
│  ✅ TypeScript + Rust dual validation                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  @liqueur/db-adapter                                        │
│                                                             │
│  🔒 Row-Level Security                                      │
│  🔒 SQL injection prevention                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  @liqueur/react                                             │
│                                                             │
│  📊 Auto-render charts, tables, and layouts                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Installation

### By Use Case

```bash
# Schema definitions only
npm install @liqueur/protocol

# Add React UI
npm install @liqueur/protocol @liqueur/react

# Full stack (AI + Database)
npm install @liqueur/protocol @liqueur/react @liqueur/ai-provider @liqueur/db-adapter
```

### Packages

| Package | Purpose |
|:--------|:--------|
| [@liqueur/protocol](https://www.npmjs.com/package/@liqueur/protocol) | Schema types & validation |
| [@liqueur/react](https://www.npmjs.com/package/@liqueur/react) | UI components |
| [@liqueur/ai-provider](https://www.npmjs.com/package/@liqueur/ai-provider) | AI provider integration |
| [@liqueur/db-adapter](https://www.npmjs.com/package/@liqueur/db-adapter) | Prisma query execution |
| [@liqueur/artifact-store](https://www.npmjs.com/package/@liqueur/artifact-store) | Schema persistence |
| [create-next-liqueur-app](https://www.npmjs.com/package/create-next-liqueur-app) | Project scaffolding CLI |

---

## Developer Setup

### Option 1: Quick Start with CLI

```bash
npx create-next-liqueur-app my-dashboard
cd my-dashboard

# Configure your AI provider
cp .env.example .env
# Edit .env with your API key

npm run dev
```

### Option 2: Add to Existing Project

```bash
npm install @liqueur/protocol @liqueur/react @liqueur/ai-provider
```

### Environment Variables

When using `@liqueur/ai-provider`, configure environment variables for your chosen AI provider:

```bash
# .env or .env.local

# Choose provider: anthropic, openai, gemini, deepseek, glm, local
AI_PROVIDER=anthropic

# ─── Anthropic (Claude) ───────────────────────────────
ANTHROPIC_API_KEY=sk-ant-your-key
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
# Models: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus-20240229

# ─── OpenAI (GPT) ─────────────────────────────────────
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
# Models: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo

# ─── Google Gemini ────────────────────────────────────
GOOGLE_API_KEY=your-key
GEMINI_MODEL=gemini-1.5-flash
# Models: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash

# ─── DeepSeek ─────────────────────────────────────────
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_MODEL=deepseek-chat
# Models: deepseek-chat, deepseek-coder

# ─── GLM (Zhipu AI) ───────────────────────────────────
GLM_API_KEY=your-key
GLM_MODEL=glm-4
# Models: glm-4, glm-4-flash, glm-3-turbo

# ─── Local LLM (Ollama, LM Studio) ────────────────────
LOCAL_LLM_BASE_URL=http://localhost:1234/v1
LOCAL_LLM_MODEL=llama3
```

### Basic Usage

```typescript
import { ProviderFactory } from '@liqueur/ai-provider';
import { LiquidRenderer } from '@liqueur/react';

// Create provider from environment variables
const provider = ProviderFactory.createFromEnv();

// Generate schema from natural language
const schema = await provider.generateSchema(
  "Show monthly expenses as a bar chart",
  databaseMetadata
);

// Render the dashboard
<LiquidRenderer schema={schema} data={data} />
```

### Example: Next.js API Route

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

### Sample Applications

| Sample | Description | Run |
|:-------|:------------|:----|
| [Household Budget](./examples/household-budget) | Full-featured with AI chat | `cd examples/household-budget && pnpm dev` |
| [Playground](./examples/playground) | Simple test environment | `cd examples/playground && pnpm dev` |

### Run from Source

```bash
git clone https://github.com/clearclown/liqueur.git
cd liqueur
pnpm install && pnpm build

cd examples/household-budget
cp .env.example .env  # Configure API keys
pnpm dev
```

---

## Security Design

### Why Not Let AI Write JavaScript?

| Approach | Risk |
|:---------|:-----|
| AI generates JS/SQL | XSS, SQL injection, arbitrary code execution |
| **Liquid: JSON only** | No executable code. Unknown fields rejected |

### Three Layers of Defense

1. **AI Output Restriction** — JSON schema only. No code generation
2. **Schema Validation** — Unknown fields rejected immediately (Fail Fast)
3. **Row-Level Security** — Users can only access their own data

```
❌ What AI DOES NOT generate
   - JavaScript
   - SQL
   - Shell commands

✅ What AI generates
   - Validated JSON schema only
```

---

## Schema Specification

### Basic Structure

```typescript
interface LiquidViewSchema {
  version: '1.0';
  layout: Layout;
  components: Component[];
  data_sources: Record<string, DataSource>;
}
```

### Components

- `chart` — Bar, line, pie, area charts
- `table` — Data table (sortable)

### DataSource

```typescript
interface DataSource {
  resource: string;      // Table name
  filters?: Filter[];    // WHERE conditions
  aggregation?: {        // GROUP BY + aggregation
    type: 'sum' | 'count' | 'avg' | 'min' | 'max';
    field: string;
    by: string;
  };
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
}
```

### Example: Expenses excluding transportation

```typescript
const schema: LiquidViewSchema = {
  version: '1.0',
  layout: { type: 'grid', columns: 2 },
  components: [
    {
      type: 'chart',
      variant: 'pie',
      title: 'Monthly Expenses',
      data_source: 'expenses'
    }
  ],
  data_sources: {
    expenses: {
      resource: 'transactions',
      filters: [
        { field: 'type', op: 'eq', value: 'EXPENSE' },
        { field: 'category', op: 'neq', value: 'Transportation' }  // ← Excluded
      ],
      aggregation: { type: 'sum', field: 'amount', by: 'category' }
    }
  }
};
```

See [@liqueur/protocol](./packages/protocol) for details.

---

## Roadmap

- [x] Phase 1: Core protocol & React components
- [x] Phase 2: AI provider integration
- [x] Phase 3: Sample app (household budget)
- [ ] Phase 4: Additional components (calendar, map, etc.)
- [ ] Phase 5: Real-time collaborative editing
- [ ] Phase 6: Plugin system

---

## Development

```bash
pnpm install
pnpm build
pnpm test
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

## License

[MIT](LICENSE)

---

<div align="center">

**Liquid Protocol**

End the era of users fighting with settings

[GitHub](https://github.com/clearclown/liqueur) · [npm](https://www.npmjs.com/package/@liqueur/protocol)

</div>
