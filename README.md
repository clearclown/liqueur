<div align="center">

# Liquid Protocol

**JSON Schema specification for AI-driven dashboard generation**

[![npm](https://img.shields.io/npm/v/@liqueur/protocol?style=flat-square&color=blue)](https://www.npmjs.com/package/@liqueur/protocol)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## What is Liquid?

Liquid is a **JSON schema specification** and a set of **TypeScript libraries** for building AI-powered dashboards.

Instead of letting AI generate executable code (JavaScript/SQL), Liquid constrains AI to output **JSON schemas only**. These schemas are validated, then rendered as UI components.

```
User: "Show monthly expenses as a bar chart"
  ↓
AI outputs JSON schema (not code)
  ↓
Schema validated by @liqueur/protocol
  ↓
Rendered by @liqueur/react
  ↓
Data fetched by @liqueur/db-adapter
```

**Result**: No code execution from AI output. No XSS. No SQL injection.

---

## Installation

```bash
# Core schema definitions
npm install @liqueur/protocol

# React UI components
npm install @liqueur/react

# AI provider abstraction (optional)
npm install @liqueur/ai-provider

# Database adapter for Prisma (optional)
npm install @liqueur/db-adapter
```

---

## Quick Start

### 1. Define a schema

```typescript
import type { LiquidViewSchema } from '@liqueur/protocol';

const schema: LiquidViewSchema = {
  version: '1.0',
  layout: { type: 'grid', columns: 2 },
  components: [
    {
      type: 'chart',
      chart_type: 'bar',
      title: 'Monthly Expenses',
      data_source: 'expenses'
    }
  ],
  data_sources: {
    expenses: {
      resource: 'transactions',
      filters: [{ field: 'type', op: 'eq', value: 'EXPENSE' }],
      aggregation: { type: 'sum', field: 'amount', by: 'month' }
    }
  }
};
```

### 2. Validate the schema

```typescript
import { SchemaValidator } from '@liqueur/protocol';

const validator = new SchemaValidator();
const result = validator.validate(schema);

if (!result.valid) {
  console.error(result.errors);
}
```

### 3. Render with React

```tsx
import { LiquidRenderer } from '@liqueur/react';

function Dashboard({ schema, data }) {
  return <LiquidRenderer schema={schema} data={data} />;
}
```

### 4. Execute data sources (with Prisma)

```typescript
import { PrismaExecutor } from '@liqueur/db-adapter';
import { prisma } from './prisma';

const executor = new PrismaExecutor(prisma, {
  resourceToModel: {
    transactions: 'transaction',
  },
});

const data = await executor.execute(schema.data_sources.expenses, userId);
```

---

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| [@liqueur/protocol](./packages/protocol) | Schema types & validators | `npm i @liqueur/protocol` |
| [@liqueur/react](./packages/react) | React component library | `npm i @liqueur/react` |
| [@liqueur/ai-provider](./packages/ai-provider) | AI provider abstraction | `npm i @liqueur/ai-provider` |
| [@liqueur/db-adapter](./packages/db-adapter) | Database query executor | `npm i @liqueur/db-adapter` |
| [@liqueur/artifact-store](./packages/artifact-store) | Schema persistence | `npm i @liqueur/artifact-store` |

---

## Schema Specification

### LiquidViewSchema

```typescript
interface LiquidViewSchema {
  version: '1.0';
  layout: Layout;
  components: Component[];
  data_sources?: Record<string, DataSource>;
}
```

### Components

- `chart` - Line, Bar, Pie, Area charts (powered by Recharts)
- `table` - Data tables with sorting

### DataSource

```typescript
interface DataSource {
  resource: string;                    // Table/model name
  filters?: Filter[];                  // WHERE conditions
  aggregation?: Aggregation;           // GROUP BY + aggregate
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
}
```

See [@liqueur/protocol](./packages/protocol) for full specification.

---

## Examples

- [Household Budget App](./examples/household-budget) - Full-featured example with AI chat
- [Playground](./examples/playground) - Simple schema testing

---

## Why Liquid?

### Security First
- AI outputs JSON only, never executable code
- Strict schema validation rejects unknown fields
- Row-Level Security enforced on every query

### Flexibility
- Use any AI provider (OpenAI, Anthropic, Gemini, etc.)
- Use any database with custom adapters
- Build your own UI/UX on top

### Standards-Based
- JSON Schema as the universal contract
- TypeScript for type safety
- Works with existing backend infrastructure

---

## License

[MIT](LICENSE)

</div>
