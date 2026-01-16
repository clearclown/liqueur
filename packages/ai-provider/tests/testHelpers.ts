import type { DatabaseMetadata, LiquidViewSchema } from '../src/types';

/**
 * Test helpers for AI Provider tests
 * Provides factory functions for common test data and reusable test suites
 */

/**
 * Creates a standard mock database metadata for testing
 * Used across multiple provider tests
 */
export function createMockMetadata(): DatabaseMetadata {
  return {
    tables: [
      {
        name: 'sales',
        columns: [
          {
            name: 'id',
            type: 'integer',
            nullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: 'month',
            type: 'text',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: 'amount',
            type: 'numeric',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        rowCount: 12,
      },
    ],
  };
}

/**
 * Creates a valid LiquidView schema for testing
 * This schema passes all validation checks
 */
export function createValidSchema(): LiquidViewSchema {
  return {
    version: '1.0',
    layout: { type: 'grid', columns: 1 },
    components: [
      {
        type: 'chart',
        variant: 'bar',
        data_source: 'ds_sales',
      },
    ],
    data_sources: {
      ds_sales: {
        resource: 'sales',
      },
    },
  };
}

/**
 * Creates an invalid schema missing the version field
 */
export function createInvalidSchemaMissingVersion(): any {
  return {
    layout: { type: 'grid', columns: 1 },
    components: [],
    data_sources: {},
  };
}

/**
 * Creates an invalid schema missing the layout field
 */
export function createInvalidSchemaMissingLayout(): any {
  return {
    version: '1.0',
    components: [],
    data_sources: {},
  };
}

/**
 * Creates a multi-table mock metadata for testing
 * @param tableNames Array of table names to include
 */
export function createMultiTableMetadata(tableNames: string[]): DatabaseMetadata {
  const baseTable = createMockMetadata().tables[0];

  return {
    tables: tableNames.map(name => ({
      ...baseTable,
      name,
    })),
  };
}
