# API Specification Test Scenarios

This document defines test scenarios for the Liquid Query API (`/api/liquid/query`).
Each scenario is written as a test case that must pass before Phase 2 is considered complete.

## API Endpoint

```
POST /api/liquid/query
```

## Request Schema

```typescript
interface QueryRequest {
  dataSource: DataSource; // from @liqueur/protocol
}

// Headers required:
// - Cookie: next-auth.session-token (authentication)
// - Content-Type: application/json
```

## Response Schemas

### Success Response (200)

```typescript
interface QueryResponse {
  data: unknown[];
  metadata: {
    totalCount: number;
    executionTime: number;
  };
}
```

### Error Responses

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

## Test Scenarios

### 1. Authentication Tests

#### TC-AUTH-001: Reject Unauthenticated Requests
```yaml
Given: No session cookie is provided
When: POST /api/liquid/query
Then:
  - Status: 401 Unauthorized
  - Body: { error: { code: "UNAUTHORIZED", message: "Authentication required" } }
```

#### TC-AUTH-002: Accept Valid Session
```yaml
Given: Valid session cookie (next-auth)
When: POST /api/liquid/query with { dataSource: { resource: "users" } }
Then:
  - Status: 200 OK
  - Body contains: { data: [...], metadata: {...} }
```

#### TC-AUTH-003: Reject Expired Session
```yaml
Given: Expired session cookie
When: POST /api/liquid/query
Then:
  - Status: 401 Unauthorized
  - Body: { error: { code: "SESSION_EXPIRED", message: "..." } }
```

### 2. Validation Tests

#### TC-VAL-001: Reject Invalid DataSource Schema
```yaml
Given: Valid session
When: POST /api/liquid/query with { dataSource: { resource: "" } }
Then:
  - Status: 400 Bad Request
  - Body: { error: { code: "INVALID_SCHEMA", message: "Resource name cannot be empty" } }
```

#### TC-VAL-002: Reject Unknown Resource
```yaml
Given: Valid session
When: POST /api/liquid/query with { dataSource: { resource: "unknown_table_xyz" } }
Then:
  - Status: 404 Not Found
  - Body: { error: { code: "RESOURCE_NOT_FOUND", message: "Resource 'unknown_table_xyz' does not exist" } }
```

#### TC-VAL-003: Validate Filter Operators
```yaml
Given: Valid session
When: POST /api/liquid/query with invalid filter operator
  { dataSource: { resource: "users", filters: [{ field: "age", op: "invalid_op", value: 18 }] } }
Then:
  - Status: 400 Bad Request
  - Body: { error: { code: "INVALID_FILTER_OP", message: "..." } }
```

#### TC-VAL-004: Validate Aggregation Types
```yaml
Given: Valid session
When: POST /api/liquid/query with invalid aggregation
  { dataSource: { resource: "sales", aggregation: { type: "invalid_agg", field: "amount" } } }
Then:
  - Status: 400 Bad Request
  - Body: { error: { code: "INVALID_AGGREGATION_TYPE", message: "..." } }
```

#### TC-VAL-005: Reject Malformed JSON
```yaml
Given: Valid session
When: POST /api/liquid/query with malformed JSON body
Then:
  - Status: 400 Bad Request
  - Body: { error: { code: "MALFORMED_REQUEST", message: "..." } }
```

### 3. Security Tests (Row-Level Security)

#### TC-SEC-001: Only Return User's Own Data
```yaml
Given: Valid session for user "user123"
When: POST /api/liquid/query with { dataSource: { resource: "expenses" } }
Then:
  - Status: 200 OK
  - Body.data: All items must have userId === "user123"
  - Body.data must NOT contain data from other users
```

#### TC-SEC-002: Apply Custom RLS Policies
```yaml
Given: Valid session for user with role "manager"
When: POST /api/liquid/query with { dataSource: { resource: "team_expenses" } }
Then:
  - Status: 200 OK
  - Body.data: All items must belong to user's team
  - Verify RLS policy: "user.role = 'manager' AND team_id = user.team_id"
```

#### TC-SEC-003: Prevent Privilege Escalation
```yaml
Given: Valid session for regular user (non-admin)
When: POST /api/liquid/query with { dataSource: { resource: "all_users" } }
Then:
  - Status: 403 Forbidden
  - Body: { error: { code: "INSUFFICIENT_PERMISSIONS", message: "..." } }
```

#### TC-SEC-004: SQL Injection Prevention
```yaml
Given: Valid session
When: POST /api/liquid/query with malicious filter
  { dataSource: { resource: "users", filters: [{ field: "name", op: "eq", value: "'; DROP TABLE users; --" }] } }
Then:
  - Status: 200 OK
  - Query executes safely (parameterized query)
  - No SQL injection occurs
  - Returns empty result or escaped value match
```

### 4. Query Execution Tests

#### TC-QUERY-001: Execute Simple SELECT
```yaml
Given: Valid session for user "user123"
When: POST /api/liquid/query with { dataSource: { resource: "expenses" } }
Then:
  - Status: 200 OK
  - Body.data: Array of expense objects
  - Body.metadata.totalCount: >= 0
  - Body.metadata.executionTime: > 0
```

#### TC-QUERY-002: Apply Filters Correctly
```yaml
Given: Valid session
When: POST /api/liquid/query with
  { dataSource: { resource: "expenses", filters: [{ field: "category", op: "eq", value: "Food" }] } }
Then:
  - Status: 200 OK
  - Body.data: All items have category === "Food"
```

#### TC-QUERY-003: Perform Aggregations
```yaml
Given: Valid session
When: POST /api/liquid/query with
  { dataSource: { resource: "expenses", aggregation: { type: "sum", field: "amount", by: "month" } } }
Then:
  - Status: 200 OK
  - Body.data: Array of { month: string, amount_sum: number }
  - Grouped by month
```

#### TC-QUERY-004: Apply Sorting
```yaml
Given: Valid session
When: POST /api/liquid/query with
  { dataSource: { resource: "expenses", sort: { field: "amount", direction: "desc" } } }
Then:
  - Status: 200 OK
  - Body.data: Sorted in descending order by amount
  - Verify: data[i].amount >= data[i+1].amount for all i
```

#### TC-QUERY-005: Respect Limit Parameter
```yaml
Given: Valid session with 50 expenses
When: POST /api/liquid/query with
  { dataSource: { resource: "expenses", limit: 10 } }
Then:
  - Status: 200 OK
  - Body.data.length === 10
  - Body.metadata.totalCount === 50 (without limit)
```

#### TC-QUERY-006: Handle Empty Results
```yaml
Given: Valid session
When: POST /api/liquid/query with
  { dataSource: { resource: "expenses", filters: [{ field: "amount", op: "gt", value: 999999 }] } }
Then:
  - Status: 200 OK
  - Body.data: []
  - Body.metadata.totalCount: 0
```

#### TC-QUERY-007: Complex Query (Filters + Aggregation + Sort + Limit)
```yaml
Given: Valid session
When: POST /api/liquid/query with
  {
    dataSource: {
      resource: "expenses",
      filters: [{ field: "category", op: "neq", value: "Travel" }],
      aggregation: { type: "sum", field: "amount", by: "month" },
      sort: { field: "amount_sum", direction: "desc" },
      limit: 5
    }
  }
Then:
  - Status: 200 OK
  - Body.data.length <= 5
  - Data is grouped by month
  - Data is sorted by sum descending
  - All excluded category "Travel"
```

### 5. Error Handling Tests

#### TC-ERR-001: Return 400 for Malformed Requests
```yaml
Given: Valid session
When: POST /api/liquid/query with invalid JSON
Then:
  - Status: 400 Bad Request
  - Body.error.code: "MALFORMED_REQUEST"
```

#### TC-ERR-002: Return 404 for Unknown Resources
```yaml
Given: Valid session
When: POST /api/liquid/query with { dataSource: { resource: "nonexistent_table" } }
Then:
  - Status: 404 Not Found
  - Body.error.code: "RESOURCE_NOT_FOUND"
```

#### TC-ERR-003: Return 500 for Database Errors
```yaml
Given: Valid session
When: Database connection fails
Then:
  - Status: 500 Internal Server Error
  - Body.error.code: "DATABASE_ERROR"
  - Body.error.message: Generic error message (no internal details exposed)
  - Error is logged server-side with full details
```

#### TC-ERR-004: Handle Timeout Errors
```yaml
Given: Valid session
When: Query exceeds timeout threshold (e.g., 30 seconds)
Then:
  - Status: 504 Gateway Timeout
  - Body.error.code: "QUERY_TIMEOUT"
```

### 6. Performance Tests

#### TC-PERF-001: Fast Response for Indexed Queries
```yaml
Given: Valid session
When: POST /api/liquid/query with indexed field filter
Then:
  - Status: 200 OK
  - Body.metadata.executionTime < 100ms
```

#### TC-PERF-002: Reasonable Response for Complex Queries
```yaml
Given: Valid session
When: POST /api/liquid/query with aggregation + multiple filters
Then:
  - Status: 200 OK
  - Body.metadata.executionTime < 1000ms
```

#### TC-PERF-003: Concurrent Request Handling
```yaml
Given: 10 concurrent valid sessions
When: All POST /api/liquid/query simultaneously
Then:
  - All requests return 200 OK
  - No request fails or times out
  - Average response time < 500ms
```

## Implementation Checklist

### Phase 2.1: API Specification
- [x] Create this specification document
- [ ] Review with team
- [ ] Define database schema for test data

### Phase 2.2: Backend API Implementation
- [ ] Implement authentication middleware (TC-AUTH-001 to TC-AUTH-003)
- [ ] Implement schema validation (TC-VAL-001 to TC-VAL-005)
- [ ] Implement RLS enforcement (TC-SEC-001 to TC-SEC-004)
- [ ] Implement query execution (TC-QUERY-001 to TC-QUERY-007)
- [ ] Implement error handling (TC-ERR-001 to TC-ERR-004)

### Phase 2.3: Testing
- [ ] Write unit tests for each component
- [ ] Write integration tests for API endpoint
- [ ] Write E2E tests for critical paths
- [ ] Performance testing (TC-PERF-001 to TC-PERF-003)

### Phase 2.4: Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Security documentation
- [ ] Performance benchmarks

## Test Data Setup

### Required Test Fixtures

```sql
-- Users table
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  team_id VARCHAR
);

-- Expenses table
CREATE TABLE expenses (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  amount DECIMAL NOT NULL,
  category VARCHAR NOT NULL,
  merchant VARCHAR,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Test data
INSERT INTO users (id, email, name, role, team_id) VALUES
  ('user123', 'test@example.com', 'Test User', 'user', 'team1'),
  ('user456', 'manager@example.com', 'Manager User', 'manager', 'team1'),
  ('user789', 'other@example.com', 'Other User', 'user', 'team2');

INSERT INTO expenses (id, user_id, amount, category, merchant, date) VALUES
  ('exp1', 'user123', 45.50, 'Food', 'Restaurant A', '2024-01-15'),
  ('exp2', 'user123', 120.00, 'Travel', 'Airline B', '2024-01-20'),
  ('exp3', 'user456', 89.99, 'Office', 'Supplier C', '2024-02-05');
```

## Success Criteria

Phase 2.2 API Implementation is complete when:
- ✅ All 23 test scenarios pass
- ✅ Code coverage >= 95%
- ✅ No critical security vulnerabilities
- ✅ Performance benchmarks met
- ✅ Documentation complete
