<div align="center">

# Liquid Protocol

**Transform dashboards with natural language. AI-driven UI generation protocol.**

[![npm](https://img.shields.io/npm/v/@liqueur/protocol?style=flat-square&color=blue)](https://www.npmjs.com/package/@liqueur/protocol)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

English | [日本語](../README.md)

</div>

---

## Why Liquid Protocol?

### The Problem: Customization Dilemma

Consider a household budget app. There are countless budget/expense management apps out there.

Yet, no matter which app you use, you'll always have requests like:

> - "Exclude transportation costs - my company reimburses those"
> - "Family card purchases should be separate - I get reimbursed"
> - "Tag all spending during my trip as 'travel'"
> - "I hate red - make it blue and black"
> - "Show me a bar chart instead of pie chart"

**Current solutions fall into two categories:**

| Approach | Example | Problem |
|----------|---------|---------|
| **Build it yourself** | Notion, Spreadsheets | Customization becomes the goal. You lose sight of actual "budget management" |
| **Add more settings** | Traditional apps | Settings screens become complex. "Freedom becomes imprisonment" |

### The Solution: Restructure dashboards with natural language

**Liquid Protocol** solves this problem fundamentally.

```
User: "Exclude transportation costs, tag travel period expenses as 'travel'"
    ↓
AI regenerates the dashboard structure itself
    ↓
Filters, charts, and layouts update automatically
```

---

## This isn't just about budget apps

We're demonstrating with a budget app now, but this technology applies to **any application**:

| Application | Traditional Problem | Liquid Solution |
|-------------|---------------------|-----------------|
| **Slack / Discord** | Complex notification settings | "Only notify me for important conversations" |
| **Stock Trading** | Fixed dashboards | "Show only tech stocks in a pie chart" |
| **Twitter / SNS** | Opaque timeline algorithms | "Hide political content" for your own feed |
| **Project Management** | Jira/Asana settings hell | "Show only my tasks this week" |

**This technology will become the standard.** Users shouldn't fight with settings screens - they should just say what they want.

---

## How it works: AI + JSON Schema + Security

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                              │
│     "Exclude transportation, show monthly expenses as bar chart" │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     AI (Claude / GPT / Gemini)                   │
│                                                                  │
│  ⚠️ Important: AI outputs JSON schema ONLY                       │
│     Never generates JavaScript or SQL                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      @liqueur/protocol                           │
│                                                                  │
│  ✅ Schema validation: Unknown fields rejected immediately       │
│  ✅ Type-safe: Double validation with TypeScript + Rust          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      @liqueur/db-adapter                         │
│                                                                  │
│  🔒 Row-Level Security: Users can only access their own data     │
│  🔒 SQL injection prevention: ORM only, no raw SQL               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       @liqueur/react                             │
│                                                                  │
│  📊 Auto-render charts, tables, and layouts                      │
└─────────────────────────────────────────────────────────────────┘
```

### Why not let AI write JavaScript?

| Approach | Risk |
|----------|------|
| AI generates JS/SQL | XSS, SQL injection, arbitrary code execution |
| **Liquid: JSON only** | Unknown fields rejected. No executable code |

---

## Quick Start

### Try in 30 seconds

```bash
npx create-next-liqueur-app my-dashboard
cd my-dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and just chat.

---

## Installation

```bash
# Schema definition only (types & validation)
npm install @liqueur/protocol

# React UI components
npm install @liqueur/protocol @liqueur/react

# Full stack (AI + Database)
npm install @liqueur/protocol @liqueur/react @liqueur/ai-provider @liqueur/db-adapter
```

### Packages

| Package | Purpose | npm |
|---------|---------|-----|
| [@liqueur/protocol](https://www.npmjs.com/package/@liqueur/protocol) | Schema types & validation | ![npm](https://img.shields.io/npm/v/@liqueur/protocol?style=flat-square) |
| [@liqueur/react](https://www.npmjs.com/package/@liqueur/react) | UI components (Chart, Table) | ![npm](https://img.shields.io/npm/v/@liqueur/react?style=flat-square) |
| [@liqueur/ai-provider](https://www.npmjs.com/package/@liqueur/ai-provider) | AI provider integration | ![npm](https://img.shields.io/npm/v/@liqueur/ai-provider?style=flat-square) |
| [@liqueur/db-adapter](https://www.npmjs.com/package/@liqueur/db-adapter) | Prisma query execution | ![npm](https://img.shields.io/npm/v/@liqueur/db-adapter?style=flat-square) |
| [@liqueur/artifact-store](https://www.npmjs.com/package/@liqueur/artifact-store) | Schema persistence | ![npm](https://img.shields.io/npm/v/@liqueur/artifact-store?style=flat-square) |
| [create-next-liqueur-app](https://www.npmjs.com/package/create-next-liqueur-app) | Project scaffolding CLI | ![npm](https://img.shields.io/npm/v/create-next-liqueur-app?style=flat-square) |

---

## Examples

| Example | Description | Run |
|---------|-------------|-----|
| [Household Budget](../examples/household-budget) | Full-featured app with AI chat | `cd examples/household-budget && pnpm dev` |
| [Playground](../examples/playground) | Simple schema testing | `cd examples/playground && pnpm dev` |

---

## License

[MIT](../LICENSE)

---

<div align="center">

**Liquid Protocol** - End the era of users fighting with settings

</div>
