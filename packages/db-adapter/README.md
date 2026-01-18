# @liqueur/db-adapter

Database adapter for executing DataSource queries with Prisma

## Overview

`@liqueur/db-adapter` provides tools for working with Liquid Protocol data sources:

- **PrismaExecutor** - Execute DataSource queries against Prisma models
- **PrismaIntrospector** - Generate DatabaseMetadata from Prisma schemas

## Installation

```bash
npm install @liqueur/db-adapter
```

### Peer Dependencies

```bash
npm install @prisma/client
```

## Usage

### PrismaExecutor

Execute DataSource queries from Liquid schemas against your Prisma database:

```typescript
import { PrismaExecutor } from '@liqueur/db-adapter';
import { PrismaClient } from '@prisma/client';
import type { DataSource } from '@liqueur/protocol';

const prisma = new PrismaClient();

const executor = new PrismaExecutor(prisma, {
  resourceToModel: {
    transactions: 'transaction',
    categories: 'category',
  },
});

// Define a data source
const dataSource: DataSource = {
  resource: 'transactions',
  filters: [
    { field: 'type', op: 'eq', value: 'EXPENSE' }
  ],
  aggregation: {
    type: 'sum',
    field: 'amount',
    by: 'category.name'
  },
  sort: { field: 'amount', direction: 'desc' },
  limit: 10
};

// Execute with Row-Level Security
const data = await executor.execute(dataSource, userId);
```

#### Row-Level Security

PrismaExecutor automatically enforces Row-Level Security by filtering data to the specified user:

```typescript
// All queries automatically include: WHERE userId = 'user-123'
const data = await executor.execute(dataSource, 'user-123');
```

#### Virtual Date Fields

The executor supports virtual date fields derived from a `date` column:

```typescript
const dataSource: DataSource = {
  resource: 'transactions',
  aggregation: {
    type: 'sum',
    field: 'amount',
    by: 'month'  // Virtual field: extracts month from date
  }
};
```

**Supported virtual fields:**
- `month` - "January", "February", etc.
- `year` - "2024", "2025", etc.
- `day` - "1", "2", ..., "31"
- `week` - "1", "2", ..., "52"
- `quarter` - "Q1", "Q2", "Q3", "Q4"

#### Aggregation Types

```typescript
// Sum
{ type: 'sum', field: 'amount', by: 'category' }

// Average
{ type: 'avg', field: 'amount', by: 'month' }

// Count
{ type: 'count', by: 'status' }

// Min/Max
{ type: 'min', field: 'amount', by: 'category' }
{ type: 'max', field: 'amount', by: 'category' }
```

#### Filter Operators

```typescript
// Equality
{ field: 'status', op: 'eq', value: 'active' }
{ field: 'status', op: 'neq', value: 'deleted' }

// Comparison
{ field: 'amount', op: 'gt', value: 100 }
{ field: 'amount', op: 'gte', value: 100 }
{ field: 'amount', op: 'lt', value: 1000 }
{ field: 'amount', op: 'lte', value: 1000 }

// String matching
{ field: 'name', op: 'contains', value: 'test' }

// Array membership
{ field: 'category', op: 'in', value: ['food', 'transport'] }
```

### PrismaIntrospector

Generate DatabaseMetadata from Prisma schema files:

```typescript
import { PrismaIntrospector } from '@liqueur/db-adapter';

const introspector = new PrismaIntrospector();

const metadata = await introspector.introspect({
  schemaPath: './prisma/schema.prisma',
});

console.log(metadata.tables);
// [
//   { name: 'User', columns: [...], relations: [...] },
//   { name: 'Transaction', columns: [...], relations: [...] },
// ]
```

#### Introspection Options

```typescript
const metadata = await introspector.introspect({
  schemaPath: './prisma/schema.prisma',
  options: {
    includeViews: true,
    includeEnums: true,
    excludeTables: ['_prisma_migrations'],
  },
});
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `PrismaExecutor` | Execute DataSource queries against Prisma |
| `PrismaIntrospector` | Parse Prisma schema to DatabaseMetadata |

### PrismaExecutor

```typescript
class PrismaExecutor {
  constructor(
    prisma: PrismaClient,
    config: {
      resourceToModel: Record<string, string>;
    }
  );

  execute(
    dataSource: DataSource,
    userId: string
  ): Promise<Record<string, unknown>[]>;
}
```

### PrismaIntrospector

```typescript
class PrismaIntrospector implements DatabaseIntrospector {
  introspect(options: {
    schemaPath: string;
    options?: IntrospectionOptions;
  }): Promise<DatabaseMetadata>;
}
```

### Types

| Type | Description |
|------|-------------|
| `DatabaseIntrospector` | Introspector interface |
| `DatabaseConnectionOptions` | DB connection options |
| `IntrospectionOptions` | Introspection options |
| `PrismaSchema` | Prisma schema structure |
| `PrismaModel` | Prisma model definition |
| `PrismaField` | Prisma field definition |
| `PrismaEnum` | Prisma enum definition |

## Development

```bash
# Build
npm run build

# Test
npm test

# Type check
npm run typecheck
```

## License

MIT
