# @liqueur/artifact-store

Artifact persistence layer for LiquidView schemas

## Overview

`@liqueur/artifact-store` provides an abstraction for storing and retrieving LiquidView schema artifacts with support for versioning, tags, and visibility control.

## Features

- **Artifact management** - Create, retrieve, update, delete, and list artifacts
- **Versioning** - Automatic version tracking on updates
- **Tags** - Categorize artifacts with tags
- **Visibility control** - Private, public, and team visibility levels
- **Query support** - Filter by user, tags, visibility, and search terms
- **Pagination** - Efficient pagination for large artifact lists
- **Type-safe** - Full TypeScript support
- **In-memory store** - Built-in implementation for development/testing

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

// Create an artifact
const artifact = await store.create({
  userId: 'user-123',
  title: 'Sales Dashboard',
  description: 'Monthly sales overview',
  schema: myLiquidViewSchema,
  tags: ['dashboard', 'sales'],
  visibility: 'private'
});

console.log('Created artifact:', artifact.id);

// Retrieve an artifact
const retrieved = await store.getById(artifact.id);

// Update an artifact
const updated = await store.update(artifact.id, {
  title: 'Updated Sales Dashboard',
  tags: ['dashboard', 'sales', 'monthly']
});

console.log('Version:', updated.version); // Incremented automatically

// Delete an artifact
await store.delete(artifact.id);
```

### Querying Artifacts

```typescript
// List artifacts with filters
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
result.artifacts.forEach(artifact => {
  console.log(`- ${artifact.title} (v${artifact.version})`);
});
```

### Pagination

```typescript
// First page
const page1 = await store.list({
  userId: 'user-123',
  limit: 10,
  offset: 0
});

// Second page
const page2 = await store.list({
  userId: 'user-123',
  limit: 10,
  offset: 10
});

console.log(`Total artifacts: ${page1.total}`);
console.log(`Showing ${page1.artifacts.length} of ${page1.total}`);
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
  visibility: ArtifactVisibility;
}

type ArtifactVisibility = 'private' | 'public' | 'team';

interface CreateArtifactInput {
  userId: string;
  title: string;
  description?: string;
  schema: LiquidViewSchema;
  tags?: string[];
  visibility?: ArtifactVisibility; // Default: 'private'
}

interface UpdateArtifactInput {
  title?: string;
  description?: string;
  schema?: LiquidViewSchema;
  tags?: string[];
  visibility?: ArtifactVisibility;
}

interface ListArtifactsQuery {
  userId?: string;
  tags?: string[];
  visibility?: ArtifactVisibility;
  search?: string; // Searches title and description
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

Built-in in-memory implementation for development and testing.

```typescript
const store = new InMemoryArtifactStore();
```

**Features:**
- All operations are synchronous but return Promises for interface compatibility
- Data is stored in memory and lost on process restart
- Suitable for development, testing, and demos
- NOT suitable for production use

## Query Helpers

The package includes query helper functions for advanced filtering and sorting:

```typescript
import {
  filterByUserId,
  filterByTags,
  filterByVisibility,
  filterBySearch,
  sortArtifacts
} from '@liqueur/artifact-store/queryHelpers';

// Filter artifacts
const filtered = filterByTags(artifacts, ['dashboard', 'sales']);

// Sort artifacts
const sorted = sortArtifacts(filtered, 'updatedAt', 'desc');
```

## Implementation Notes

### Versioning

Artifacts automatically increment their `version` number on each update:
- Initial version: 1
- After first update: 2
- And so on...

### Tag Filtering

When filtering by tags, ALL specified tags must be present (AND logic):

```typescript
// This matches artifacts with BOTH 'dashboard' AND 'sales' tags
const result = await store.list({
  tags: ['dashboard', 'sales']
});
```

### Search

The search parameter performs case-insensitive substring matching on:
- `title` field
- `description` field (if present)

## Development

```bash
# Build
npm run build

# Test
npm test

# Test with coverage
npm run test:coverage

# Lint
npm run lint

# Type check
npm run typecheck
```

## Future Enhancements

- **Database backends** - PostgreSQL, MongoDB implementations
- **Full-text search** - Elasticsearch integration
- **Audit logging** - Track all artifact changes
- **Permissions** - Fine-grained access control
- **Sharing** - Share artifacts between users

## Contributing

See the main [repository](https://github.com/your-org/liqueur) for contribution guidelines.

## License

MIT
