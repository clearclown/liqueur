# @liqueur/protocol

Liquid Protocol - Type definitions and validators for AI-driven dynamic UI generation

## Overview

`@liqueur/protocol` provides TypeScript type definitions and validation logic for the Liquid Protocol, a JSON Schema-based protocol for generating dynamic user interfaces through AI.

## Features

- **Type-safe schema definitions** - Comprehensive TypeScript types for all protocol components
- **Runtime validation** - SchemaValidator for verifying JSON schemas at runtime
- **Component types** - Chart, Table, and extensible component definitions
- **Data source abstractions** - Filter, aggregation, and sort specifications
- **Layout system** - Grid and Stack layout definitions

## Installation

```bash
npm install @liqueur/protocol
```

## Usage

### Type Definitions

```typescript
import type { LiquidViewSchema, ChartComponent, DataSource } from '@liqueur/protocol';

const schema: LiquidViewSchema = {
  version: '1.0',
  layout: {
    type: 'grid',
    columns: 2,
    gap: 16
  },
  components: [
    {
      type: 'chart',
      variant: 'bar',
      title: 'Monthly Sales',
      data_source: 'sales'
    }
  ],
  data_sources: {
    sales: {
      resource: 'sales',
      aggregation: {
        type: 'sum',
        field: 'amount',
        by: 'month'
      }
    }
  }
};
```

### Schema Validation

```typescript
import { SchemaValidator } from '@liqueur/protocol';

const validator = new SchemaValidator();
const result = validator.validate(schema);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## API Reference

### Types

- `LiquidViewSchema` - Root schema type
- `Component` - Union type of all component variants (Chart, Table, etc.)
- `ChartComponent` - Chart component with variants (bar, line, pie)
- `TableComponent` - Table component with column definitions
- `DataSource` - Data source with filters, aggregation, and sorting
- `Layout` - Layout configuration (Grid, Stack)

### Validators

- `SchemaValidator` - Validates LiquidView schemas
  - `validate(schema: unknown): ValidationResult`

### Validation Error Codes

- `MISSING_REQUIRED_FIELD` - Required field is missing
- `INVALID_TYPE` - Field type mismatch
- `INVALID_ENUM_VALUE` - Enum value not in allowed list
- `INVALID_LAYOUT_TYPE` - Invalid layout type
- `INVALID_COMPONENT_TYPE` - Invalid component type
- `INVALID_CHART_VARIANT` - Invalid chart variant
- `DATA_SOURCE_NOT_FOUND` - Referenced data source doesn't exist

## Contributing

See the main [repository](https://github.com/your-org/liqueur) for contribution guidelines.

## License

MIT
