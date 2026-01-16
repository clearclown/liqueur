import { NextRequest, NextResponse } from 'next/server';
import type { DataSource } from '@liqueur/protocol';

// Response types
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

// Known resources (mock database schema)
const KNOWN_RESOURCES = ['expenses', 'sales', 'users'];

// Mock data
const MOCK_DATA: Record<string, unknown[]> = {
  expenses: [
    { id: '1', userId: 'user123', category: 'Food', amount: 45.50, date: '2024-01-15' },
    { id: '2', userId: 'user123', category: 'Travel', amount: 120.00, date: '2024-01-20' },
    { id: '3', userId: 'user123', category: 'Food', amount: 30.00, date: '2024-02-05' },
  ],
  sales: [
    { id: '1', product: 'Product A', amount: 100, date: '2024-01-01' },
    { id: '2', product: 'Product B', amount: 200, date: '2024-01-02' },
  ],
  users: [
    { id: 'user123', name: 'Test User', email: 'test@example.com' },
  ],
};

// Valid filter operators
const VALID_FILTER_OPS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'contains'];

// Valid aggregation types
const VALID_AGGREGATION_TYPES = ['count', 'sum', 'avg', 'min', 'max'];

/**
 * Validate DataSource schema
 */
function validateDataSource(dataSource: DataSource): string | null {
  // Validate resource name
  if (!dataSource.resource || dataSource.resource.trim() === '') {
    return 'Resource name cannot be empty';
  }

  // Validate known resources
  if (!KNOWN_RESOURCES.includes(dataSource.resource)) {
    return null; // Will be handled separately with 404
  }

  // Validate filters
  if (dataSource.filters) {
    for (const filter of dataSource.filters) {
      if (!VALID_FILTER_OPS.includes(filter.op)) {
        return `Invalid filter operator: ${filter.op}`;
      }
    }
  }

  // Validate aggregation
  if (dataSource.aggregation) {
    if (!VALID_AGGREGATION_TYPES.includes(dataSource.aggregation.type)) {
      return `Invalid aggregation type: ${dataSource.aggregation.type}`;
    }
  }

  return null;
}

/**
 * Apply filters to data
 */
function applyFilters(data: unknown[], filters: DataSource['filters']): unknown[] {
  if (!filters || filters.length === 0) {
    return data;
  }

  return data.filter((item) => {
    return filters.every((filter) => {
      const itemValue = (item as Record<string, unknown>)[filter.field];

      switch (filter.op) {
        case 'eq':
          return itemValue === filter.value;
        case 'neq':
          return itemValue !== filter.value;
        case 'gt':
          return typeof itemValue === 'number' && itemValue > (filter.value as number);
        case 'gte':
          return typeof itemValue === 'number' && itemValue >= (filter.value as number);
        case 'lt':
          return typeof itemValue === 'number' && itemValue < (filter.value as number);
        case 'lte':
          return typeof itemValue === 'number' && itemValue <= (filter.value as number);
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(itemValue);
        case 'contains':
          return typeof itemValue === 'string' && itemValue.includes(filter.value as string);
        default:
          return true;
      }
    });
  });
}

/**
 * POST /api/liquid/query
 */
export async function POST(request: NextRequest): Promise<NextResponse<QueryResponse | ErrorResponse>> {
  const startTime = Date.now();

  try {
    // Parse request body
    let body: { dataSource: DataSource };
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: 'MALFORMED_REQUEST',
            message: 'Invalid JSON in request body',
            details: error instanceof Error ? error.message : String(error),
          },
        },
        { status: 400 }
      );
    }

    // Validate request structure
    if (!body.dataSource) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SCHEMA',
            message: 'Missing dataSource in request body',
          },
        },
        { status: 400 }
      );
    }

    const { dataSource } = body;

    // Validate DataSource schema
    const validationError = validateDataSource(dataSource);
    if (validationError) {
      const errorCode = validationError.includes('operator')
        ? 'INVALID_FILTER_OP'
        : validationError.includes('aggregation')
        ? 'INVALID_AGGREGATION_TYPE'
        : 'INVALID_SCHEMA';

      return NextResponse.json(
        {
          error: {
            code: errorCode,
            message: validationError,
          },
        },
        { status: 400 }
      );
    }

    // Check if resource exists
    if (!KNOWN_RESOURCES.includes(dataSource.resource)) {
      return NextResponse.json(
        {
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: `Resource '${dataSource.resource}' does not exist`,
          },
        },
        { status: 404 }
      );
    }

    // Get data from mock database
    let data = [...(MOCK_DATA[dataSource.resource] || [])];

    // Apply filters
    data = applyFilters(data, dataSource.filters);

    // Apply limit
    const totalCount = data.length;
    if (dataSource.limit && dataSource.limit > 0) {
      data = data.slice(0, dataSource.limit);
    }

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      data,
      metadata: {
        totalCount,
        executionTime,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
