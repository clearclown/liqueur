# @liqueur/artifact-store

Artifact persistence layer for LiquidView schemas

## Overview

`@liqueur/artifact-store` provides an abstraction for storing and retrieving LiquidView schema artifacts with versioning, tags, and visibility control.

## Features

- **Artifact management** - Create, retrieve, update, delete, and list
- **Versioning** - Automatic version tracking on updates
- **Tags** - Categorize artifacts with tags
- **Visibility control** - Private, public, and team levels
- **Query support** - Filter by user, tags, visibility, search
- **Pagination** - Efficient pagination for large lists
- **Type-safe** - Full TypeScript support

## Installation

```bash
npm install @liqueur/artifact-store @liqueur/protocol
```

## Usage

### Basic Operations

```typescript
import { InMemoryArtifactStore } from '@liqueur/artifact-store';
import type { LiquidViewSchema } from '@liqueur/protocol';

const store = new InMemoryArtifactStore();

// Create
const artifact = await store.create({
  userId: 'user-123',
  title: 'Sales Dashboard',
  description: 'Monthly sales overview',
  schema: mySchema,
  tags: ['dashboard', 'sales'],
  visibility: 'private'
});

// Retrieve
const retrieved = await store.getById(artifact.id);

// Update (version auto-increments)
const updated = await store.update(artifact.id, {
  title: 'Updated Dashboard',
  tags: ['dashboard', 'sales', 'monthly']
});

// Delete
await store.delete(artifact.id);
```

### Querying Artifacts

```typescript
const result = await store.list({
  userId: 'user-123',
  tags: ['dashboard'],
  visibility: 'private',
  search: 'sales',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  limit: 10,
  offset: 0
});

console.log(`Found ${result.total} artifacts`);
result.artifacts.forEach(a => console.log(`- ${a.title} (v${a.version})`));
```

### Pagination

```typescript
// First page
const page1 = await store.list({ userId: 'user-123', limit: 10, offset: 0 });

// Second page
const page2 = await store.list({ userId: 'user-123', limit: 10, offset: 10 });
```

## API Reference

### ArtifactStore Interface

```typescript
interface ArtifactStore {
  create(input: CreateArtifactInput): Promise<Artifact>;
  getById(id: string): Promise<Artifact | null>;
  update(id: string, input: UpdateArtifactInput): Promise<Artifact>;
  delete(id: string): Promise<void>;
  list(query: ListArtifactsQuery): Promise<ListArtifactsResponse>;
}
```

### Types

```typescript
interface Artifact {
  id: string;
  userId: string;
  title: string;
  description?: string;
  schema: LiquidViewSchema;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  visibility: 'private' | 'public' | 'team';
}

interface CreateArtifactInput {
  userId: string;
  title: string;
  description?: string;
  schema: LiquidViewSchema;
  tags?: string[];
  visibility?: 'private' | 'public' | 'team';  // Default: 'private'
}

interface UpdateArtifactInput {
  title?: string;
  description?: string;
  schema?: LiquidViewSchema;
  tags?: string[];
  visibility?: 'private' | 'public' | 'team';
}

interface ListArtifactsQuery {
  userId?: string;
  tags?: string[];           // AND logic
  visibility?: 'private' | 'public' | 'team';
  search?: string;           // title/description
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface ListArtifactsResponse {
  artifacts: Artifact[];
  total: number;
  limit: number;
  offset: number;
}
```

### InMemoryArtifactStore

Built-in in-memory implementation for development/testing:

```typescript
const store = new InMemoryArtifactStore();
```

**Notes:**
- Data is lost on process restart
- Suitable for development, testing, demos
- NOT for production use

## Implementation Notes

### Versioning

Artifacts auto-increment version on each update:
- Initial: version 1
- After update: version 2
- And so on...

### Tag Filtering

All specified tags must be present (AND logic):

```typescript
// Matches artifacts with BOTH 'dashboard' AND 'sales' tags
const result = await store.list({ tags: ['dashboard', 'sales'] });
```

### Search

Case-insensitive substring matching on `title` and `description`.

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
