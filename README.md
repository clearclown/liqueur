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

### By Use Case

Choose the packages you need:

```bash
# Schema definition only (types & validation)
npm install @liqueur/protocol

# React UI (includes protocol)
npm install @liqueur/protocol @liqueur/react

# Full stack with AI + Database
npm install @liqueur/protocol @liqueur/react @liqueur/ai-provider @liqueur/db-adapter

# Everything
npm install @liqueur/protocol @liqueur/react @liqueur/ai-provider @liqueur/db-adapter @liqueur/artifact-store
```

### Package Overview

| Package | Purpose | Required |
|---------|---------|----------|
| [@liqueur/protocol](https://www.npmjs.com/package/@liqueur/protocol) | Schema types & validation | **Yes** |
| [@liqueur/react](https://www.npmjs.com/package/@liqueur/react) | UI components (Chart, Table) | For frontend |
| [@liqueur/ai-provider](https://www.npmjs.com/package/@liqueur/ai-provider) | AI schema generation | For AI features |
| [@liqueur/db-adapter](https://www.npmjs.com/package/@liqueur/db-adapter) | Prisma query execution | For database |
| [@liqueur/artifact-store](https://www.npmjs.com/package/@liqueur/artifact-store) | Schema persistence | For saving dashboards |

---

## Quick Start

### Quickest: Use the CLI

```bash
npx create-next-liqueur-app my-dashboard
cd my-dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting with AI to build your dashboard.

### Manual Setup

#### 1. Define a schema

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

#### 2. Validate the schema

```typescript
import { SchemaValidator } from '@liqueur/protocol';

const validator = new SchemaValidator();
const result = validator.validate(schema);

if (!result.valid) {
  console.error(result.errors);
}
```

#### 3. Render with React

```tsx
import { LiquidRenderer } from '@liqueur/react';

function Dashboard({ schema, data }) {
  return <LiquidRenderer schema={schema} data={data} />;
}
```

#### 4. Execute data sources (with Prisma)

```typescript
import { PrismaExecutor } from '@liqueur/db-adapter';
import { prisma } from './prisma';

const executor = new PrismaExecutor(prisma, {
  resourceToModel: {
    transactions: 'transaction',
  },
});

// Automatically applies Row-Level Security (userId filtering)
const data = await executor.execute(schema.data_sources.expenses, userId);
```

#### 5. Generate schema with AI (optional)

```typescript
import { ProviderFactory } from '@liqueur/ai-provider';

const provider = ProviderFactory.fromEnv(); // Uses ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.

const result = await provider.generateSchema(
  'Show monthly expenses as a bar chart',
  databaseMetadata
);

if (result.valid) {
  // Use result.schema
}
```

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

| Example | Description | Run |
|---------|-------------|-----|
| [Household Budget](./examples/household-budget) | Full-featured app with AI chat | `cd examples/household-budget && npm run dev` |
| [Playground](./examples/playground) | Simple schema testing | `cd examples/playground && npm run dev` |

### Run Example Locally

```bash
git clone https://github.com/clearclown/liqueur.git
cd liqueur
pnpm install
pnpm build

# Run household budget app
cd examples/household-budget
cp .env.example .env  # Configure your API keys
pnpm dev
```

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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup.

```bash
# Development
pnpm install
pnpm build
pnpm test
```

---

## License

[MIT](LICENSE)

</div>
