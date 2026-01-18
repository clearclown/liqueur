# @liqueur/protocol

JSON Schema specification for AI-driven dashboard generation

## Overview

`@liqueur/protocol` provides TypeScript type definitions and validation for the Liquid Protocol - a JSON Schema-based specification for generating dynamic dashboards through AI.

**Key principle**: AI outputs JSON schemas only, never executable code. This eliminates XSS, SQL injection, and arbitrary code execution risks.

## Features

- **Type-safe schema definitions** - Comprehensive TypeScript types
- **Runtime validation** - SchemaValidator for verifying JSON schemas
- **Component types** - Chart (bar, line, pie, area) and Table
- **Data source abstractions** - Filters, aggregation, sorting, pagination
- **Layout system** - Grid and Stack layouts

## Installation

```bash
npm install @liqueur/protocol
```

## Usage

### Define a Schema

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
    },
    {
      type: 'table',
      columns: ['date', 'category', 'amount'],
      title: 'Recent Transactions',
      data_source: 'transactions'
    }
  ],
  data_sources: {
    expenses: {
      resource: 'transactions',
      filters: [{ field: 'type', op: 'eq', value: 'EXPENSE' }],
      aggregation: { type: 'sum', field: 'amount', by: 'month' }
    },
    transactions: {
      resource: 'transactions',
      sort: { field: 'date', direction: 'desc' },
      limit: 10
    }
  }
};
```

### Validate a Schema

```typescript
import { SchemaValidator } from '@liqueur/protocol';

const validator = new SchemaValidator();
const result = validator.validate(schema);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

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

#### Chart

```typescript
interface ChartComponent {
  type: 'chart';
  chart_type: 'bar' | 'line' | 'pie' | 'area';
  title?: string;
  data_source?: string;
  xKey?: string;      // X-axis field
  yKeys?: string[];   // Y-axis fields
  width?: number | string;
  height?: number;
}
```

#### Table

```typescript
interface TableComponent {
  type: 'table';
  columns: string[];
  title?: string;
  data_source?: string;
}
```

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

### Filter

```typescript
interface Filter {
  field: string;
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: string | number | boolean | (string | number)[];
}
```

### Aggregation

```typescript
interface Aggregation {
  type: 'sum' | 'avg' | 'count' | 'min' | 'max';
  field?: string;  // Required for sum, avg, min, max
  by?: string;     // GROUP BY field
}
```

### Layout

```typescript
// Grid layout
interface GridLayout {
  type: 'grid';
  columns?: number;  // Default: 2
  gap?: number;      // Default: 16
}

// Stack layout
interface StackLayout {
  type: 'stack';
  gap?: number;
}
```

## Validation Error Codes

| Code | Description |
|------|-------------|
| `MISSING_REQUIRED_FIELD` | Required field is missing |
| `INVALID_TYPE` | Field type mismatch |
| `INVALID_ENUM_VALUE` | Value not in allowed list |
| `INVALID_LAYOUT_TYPE` | Invalid layout type |
| `INVALID_COMPONENT_TYPE` | Invalid component type |
| `INVALID_CHART_TYPE` | Invalid chart type |
| `DATA_SOURCE_NOT_FOUND` | Referenced data source doesn't exist |

## Development

```bash
# Build
npm run build

# Test
npm test

# Test with coverage
npm run test:coverage

# Type check
npm run typecheck
```

## License

MIT
