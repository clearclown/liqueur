# Phase 2 Implementation Plan: Backend API Integration

## Executive Summary

Phase 2では、Phase 1で実装したモックデータベースの`useLiquidView`フックを、実際のバックエンドAPIと統合します。

**目標**:
- FR-06: DataSource定義をORMクエリに変換
- FR-07: Row-Level Securityの強制
- NFR-01: XSS/SQLインジェクション防止
- NFR-02: Least Privilege原則の適用

## Architecture Overview

```
Frontend (Next.js/React)
  ├── useLiquidView Hook
  │   └── POST /api/liquid/query
  │       ↓
Backend API (Next.js API Routes)
  ├── Authentication Check
  ├── Schema Validation
  └── Query Execution
      ↓
Rust Backend (reinhardt-web)
  ├── DataSource → ORM Query
  ├── Row-Level Security
  └── Query Result
```

## Implementation Phases

### Phase 2.1: Backend API Design & Specification

**TDD Approach**: API仕様書をテストケースとして作成

#### API Endpoint Specification

```typescript
// POST /api/liquid/query
interface QueryRequest {
  dataSource: DataSource; // from @liqueur/protocol
  userId: string;         // from session
}

interface QueryResponse {
  data: unknown[];
  metadata: {
    totalCount: number;
    executionTime: number;
  };
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

#### Test Specification File

Location: `docs/development/api-spec-test.md`

```markdown
## API Test Scenarios

### Authentication Tests
1. Should reject unauthenticated requests (401)
2. Should accept valid session tokens
3. Should validate CSRF tokens

### Validation Tests
4. Should reject invalid DataSource schema
5. Should reject unknown resource names
6. Should validate filter operators
7. Should validate aggregation types

### Security Tests (Row-Level Security)
8. Should only return user's own data
9. Should apply custom RLS policies
10. Should prevent privilege escalation

### Query Execution Tests
11. Should execute simple SELECT queries
12. Should apply filters correctly
13. Should perform aggregations
14. Should apply sorting
15. Should respect limit parameter
16. Should handle empty results

### Error Handling Tests
17. Should return 400 for malformed requests
18. Should return 404 for unknown resources
19. Should return 500 for database errors
20. Should log errors without exposing internals
```

### Phase 2.2: Backend API Implementation (TDD)

**Location**: `packages/playground/app/api/liquid/query/route.ts`

#### Step 1: Authentication Middleware

```typescript
// TDD Red
describe('Authentication', () => {
  it('should reject requests without session', async () => {
    const response = await fetch('/api/liquid/query', {
      method: 'POST',
      body: JSON.stringify({ dataSource: { resource: 'users' } }),
    });
    expect(response.status).toBe(401);
  });
});

// TDD Green
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }
  // ...
}
```

#### Step 2: Schema Validation

```typescript
// TDD Red
it('should validate DataSource schema', async () => {
  const response = await POST({
    dataSource: { resource: '' }, // invalid
  });
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('INVALID_SCHEMA');
});

// TDD Green
const validationResult = validateDataSource(body.dataSource);
if (!validationResult.valid) {
  return NextResponse.json(
    { error: { code: 'INVALID_SCHEMA', message: validationResult.error } },
    { status: 400 }
  );
}
```

#### Step 3: Query Execution with RLS

```typescript
// TDD Red
it('should only return current user data', async () => {
  const session = { user: { id: 'user123' } };
  const response = await POST({
    dataSource: { resource: 'expenses' },
  }, session);

  const { data } = response.body;
  expect(data.every(item => item.userId === 'user123')).toBe(true);
});

// TDD Green
const queryResult = await executeQuery({
  dataSource: body.dataSource,
  userId: session.user.id,
  rlsContext: {
    userId: session.user.id,
    role: session.user.role,
  },
});
```

### Phase 2.3: useLiquidView API Integration (TDD)

**Location**: `packages/react/src/hooks/useLiquidView.ts`

#### Step 1: API Client Implementation

```typescript
// TDD Red
describe('useLiquidView - API Integration', () => {
  it('should call /api/liquid/query endpoint', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    const schema = {
      version: '1.0',
      layout: { type: 'grid', columns: 1 },
      components: [],
      data_sources: {
        ds_sales: { resource: 'sales' },
      },
    };

    renderHook(() => useLiquidView({ schema }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/liquid/query',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('sales'),
        })
      );
    });
  });
});

// TDD Green
async function fetchDataFromAPI(dataSource: DataSource): Promise<unknown[]> {
  const response = await fetch('/api/liquid/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataSource }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}
```

#### Step 2: Error Handling

```typescript
// TDD Red
it('should handle API errors gracefully', async () => {
  vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

  const { result } = renderHook(() => useLiquidView({ schema }));

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).not.toBeNull();
  expect(result.current.error?.message).toContain('Network error');
});

// TDD Green - already implemented in Phase 1 try-catch
```

#### Step 3: Feature Flag for Mock/Real Data

```typescript
// packages/react/src/hooks/useLiquidView.ts
interface UseLiquidViewParams {
  schema: LiquidViewSchema;
  useMockData?: boolean; // default: false (use real API)
}

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (Object.keys(schema.data_sources).length === 0) {
        setData({});
        return;
      }

      const fetchedData: Record<string, unknown[]> = {};
      for (const [name, dataSource] of Object.entries(schema.data_sources)) {
        if (useMockData) {
          fetchedData[name] = generateMockData(dataSource);
        } else {
          fetchedData[name] = await fetchDataFromAPI(dataSource);
        }
      }

      setData(fetchedData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData({});
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [schema, useMockData]);
```

### Phase 2.4: Rust Backend Integration (Optional)

**Note**: Phase 2では、Next.js API Routesで簡易実装を行い、Rust統合はPhase 3に延期可能。

ただし、以下の準備を行う：

1. **API Gateway Pattern**
   ```typescript
   // packages/playground/app/api/liquid/query/route.ts
   async function executeQuery(params: QueryParams) {
     // Future: Call Rust backend
     // const result = await fetch('http://rust-backend:8080/query', ...);

     // Current: Use prisma/drizzle ORM directly
     const result = await db.query(...);
     return result;
   }
   ```

2. **Query Builder Abstraction**
   ```typescript
   interface QueryExecutor {
     execute(dataSource: DataSource, context: SecurityContext): Promise<unknown[]>;
   }

   class PrismaQueryExecutor implements QueryExecutor {
     // Temporary implementation for Phase 2
   }

   class RustBackendExecutor implements QueryExecutor {
     // Future implementation for Phase 3
   }
   ```

### Phase 2.5: E2E Testing

**Location**: `tests/e2e/liquid-query.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Liquid Query E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
  });

  test('should render chart with real data', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for API call
    await page.waitForResponse(response =>
      response.url().includes('/api/liquid/query') && response.status() === 200
    );

    // Verify chart is rendered
    await expect(page.locator('[data-testid="liquid-component-chart-0"]')).toBeVisible();

    // Verify data is displayed
    const chartData = await page.locator('.recharts-bar-rectangle').count();
    expect(chartData).toBeGreaterThan(0);
  });

  test('should enforce row-level security', async ({ page }) => {
    await page.goto('/dashboard');

    const apiResponse = await page.waitForResponse(response =>
      response.url().includes('/api/liquid/query')
    );

    const data = await apiResponse.json();

    // Verify all data belongs to current user
    expect(data.data.every(item => item.userId === 'test-user-id')).toBe(true);
  });
});
```

## Testing Strategy

### Unit Tests
- ✅ Authentication middleware
- ✅ Schema validation
- ✅ Query builder
- ✅ RLS enforcement
- ✅ Error handling

### Integration Tests
- ✅ API endpoint with database
- ✅ useLiquidView with real API
- ✅ Error scenarios

### E2E Tests
- ✅ Full user flow
- ✅ Security verification
- ✅ Performance benchmarks

## Coverage Goals

| Layer | Target | Enforcement |
|-------|--------|-------------|
| API Routes | 95%+ | CI Fail |
| useLiquidView | 100% | CI Fail |
| E2E Critical Paths | 100% | CI Fail |

## Git Workflow

### Feature Branches

```bash
# Phase 2.1: API Spec
git checkout -b feat/phase2-api-spec
# ... implement API spec and tests
git commit -m "docs(api): add Phase 2 API specification and test scenarios"
git push origin feat/phase2-api-spec

# Phase 2.2: Backend API
git checkout -b feat/phase2-backend-api
# ... implement API routes with TDD
git commit -m "feat(api): implement /api/liquid/query with RLS (Phase 2.2)"
git push origin feat/phase2-backend-api

# Phase 2.3: Frontend Integration
git checkout -b feat/phase2-frontend-integration
# ... integrate useLiquidView with API
git commit -m "feat(react): integrate useLiquidView with backend API (Phase 2.3)"
git push origin feat/phase2-frontend-integration

# Phase 2.5: E2E Tests
git checkout -b feat/phase2-e2e-tests
# ... implement E2E tests
git commit -m "test(e2e): add Liquid query E2E tests (Phase 2.5)"
git push origin feat/phase2-e2e-tests
```

### Merge Strategy

すべてのフィーチャーブランチをmainにマージ後、Phase 2完了タグを作成：

```bash
git tag -a v0.2.0 -m "Phase 2: Backend API Integration Complete"
git push origin v0.2.0
```

## Success Criteria

Phase 2は以下の条件を全て満たした時点で完了とする：

- [ ] API仕様書と対応するテストシナリオの作成
- [ ] /api/liquid/query エンドポイントの実装（95%+ coverage）
- [ ] useLiquidViewのAPI統合（100% coverage維持）
- [ ] E2E テストの実装と全パス
- [ ] Row-Level Securityの動作検証
- [ ] パフォーマンスベンチマーク（NFR-03）
- [ ] 全変更のコミットとpush
- [ ] Phase 2完了タグの作成

## Next Steps After Phase 2

Phase 3では以下を実装：
- Rust backend (reinhardt-web) 統合
- Artifact永続化（FR-10, FR-11）
- AI生成機能統合（FR-01, FR-02, FR-03）
- Production-ready最適化
