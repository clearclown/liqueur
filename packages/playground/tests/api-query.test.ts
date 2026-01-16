import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/liquid/query/route';
import { createMockRequest } from './helpers/testHelpers';

describe('/api/liquid/query - TC-VAL Test Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-VAL-001: Reject Invalid DataSource Schema
  it('TC-VAL-001: should reject empty resource name', async () => {
    const request = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', { dataSource: { resource: '' } });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('INVALID_SCHEMA');
    expect(body.error.message).toContain('Resource name cannot be empty');
  });

  // TC-VAL-002: Reject Unknown Resource
  it('TC-VAL-002: should reject unknown resource', async () => {
    const request = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', { dataSource: { resource: 'unknown_table_xyz' } });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect(body.error.message).toContain('unknown_table_xyz');
  });

  // TC-VAL-003: Validate Filter Operators
  it('TC-VAL-003: should validate filter operators', async () => {
    const request = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', {
        dataSource: {
          resource: 'expenses',
          filters: [{ field: 'age', op: 'invalid_op', value: 18 }],
        },
      })

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('INVALID_FILTER_OP');
  });

  // TC-VAL-004: Validate Aggregation Types
  it('TC-VAL-004: should validate aggregation types', async () => {
    const request = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', {
        dataSource: {
          resource: 'sales',
          aggregation: { type: 'invalid_agg', field: 'amount' },
        },
      })

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('INVALID_AGGREGATION_TYPE');
  });

  // TC-VAL-005: Reject Malformed JSON
  it('TC-VAL-005: should reject malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/liquid/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json{',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('MALFORMED_REQUEST');
  });

  // TC-QUERY-001: Execute Simple SELECT
  it('TC-QUERY-001: should execute simple query', async () => {
    const request = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', { dataSource: { resource: 'expenses' } });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty('metadata');
    expect(body.metadata).toHaveProperty('totalCount');
    expect(body.metadata).toHaveProperty('executionTime');
  });

  // TC-QUERY-002: Apply Filters Correctly
  it('TC-QUERY-002: should apply filters', async () => {
    const request = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', {
        dataSource: {
          resource: 'expenses',
          filters: [{ field: 'category', op: 'eq', value: 'Food' }],
        },
      })

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'Food' }),
      ])
    );
  });

  // TC-QUERY-006: Handle Empty Results
  it('TC-QUERY-006: should handle empty results', async () => {
    const request = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', {
        dataSource: {
          resource: 'expenses',
          filters: [{ field: 'amount', op: 'gt', value: 999999 }],
        },
      })

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.metadata.totalCount).toBe(0);
  });

  // Additional test: Missing dataSource
  it('should reject request without dataSource', async () => {
    const request = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', {});

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('INVALID_SCHEMA');
    expect(body.error.message).toContain('Missing dataSource');
  });

  // TC-QUERY-005: Respect Limit Parameter
  it('TC-QUERY-005: should respect limit parameter', async () => {
    const request = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', {
        dataSource: {
          resource: 'expenses',
          limit: 1,
        },
      })

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.length).toBe(1);
    expect(body.metadata.totalCount).toBe(3); // Total without limit
  });

  // Test all filter operators
  it('should handle all filter operators', async () => {
    // Test 'neq' operator
    const requestNeq = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', {
        dataSource: {
          resource: 'expenses',
          filters: [{ field: 'category', op: 'neq', value: 'Food' }],
        },
      })

    const responseNeq = await POST(requestNeq);
    const bodyNeq = await responseNeq.json();

    expect(responseNeq.status).toBe(200);
    expect(bodyNeq.data.every((item: { category: string }) => item.category !== 'Food')).toBe(true);

    // Test 'gte' operator
    const requestGte = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', {
        dataSource: {
          resource: 'expenses',
          filters: [{ field: 'amount', op: 'gte', value: 45.50 }],
        },
      })

    const responseGte = await POST(requestGte);
    const bodyGte = await responseGte.json();

    expect(responseGte.status).toBe(200);
    expect(bodyGte.data.length).toBeGreaterThan(0);

    // Test 'lt' operator
    const requestLt = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', {
        dataSource: {
          resource: 'expenses',
          filters: [{ field: 'amount', op: 'lt', value: 50 }],
        },
      })

    const responseLt = await POST(requestLt);
    const bodyLt = await responseLt.json();

    expect(responseLt.status).toBe(200);
    expect(bodyLt.data.length).toBeGreaterThan(0);

    // Test 'lte' operator
    const requestLte = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', {
        dataSource: {
          resource: 'expenses',
          filters: [{ field: 'amount', op: 'lte', value: 45.50 }],
        },
      })

    const responseLte = await POST(requestLte);
    const bodyLte = await responseLte.json();

    expect(responseLte.status).toBe(200);
    expect(bodyLte.data.length).toBeGreaterThan(0);

    // Test 'in' operator
    const requestIn = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', {
        dataSource: {
          resource: 'expenses',
          filters: [{ field: 'category', op: 'in', value: ['Food', 'Travel'] }],
        },
      })

    const responseIn = await POST(requestIn);
    const bodyIn = await responseIn.json();

    expect(responseIn.status).toBe(200);
    expect(bodyIn.data.length).toBe(3);

    // Test 'contains' operator
    const requestContains = createMockRequest('http://localhost:3000/api/liquid/query', 'POST', {
        dataSource: {
          resource: 'expenses',
          filters: [{ field: 'category', op: 'contains', value: 'oo' }],
        },
      })

    const responseContains = await POST(requestContains);
    const bodyContains = await responseContains.json();

    expect(responseContains.status).toBe(200);
    expect(bodyContains.data.every((item: { category: string }) => item.category.includes('oo'))).toBe(true);
  });
});
