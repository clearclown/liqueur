/**
 * DataSource Executor Types
 *
 * Types for executing DataSource queries against Prisma
 */

import type { DataSource, FilterOperator } from "@liqueur/protocol";

/**
 * Configuration for DataSource execution
 */
export interface ExecutorConfig {
  /**
   * Map resource names to Prisma model names
   * Example: { transactions: 'transaction', categories: 'category' }
   */
  resourceToModel: Record<string, string>;

  /**
   * Enum field mappings for type conversion
   * Example: { type: { expense: 'EXPENSE', income: 'INCOME' } }
   */
  enumMappings?: Record<string, Record<string, unknown>>;

  /**
   * Fields that are date fields (for automatic date conversion)
   */
  dateFields?: string[];

  /**
   * Custom field resolver for complex field lookups (like category.name → categoryId)
   */
  fieldResolver?: FieldResolver;

  /**
   * Custom include configuration for models
   */
  modelIncludes?: Record<string, Record<string, boolean>>;

  /**
   * Result transformer for flattening nested objects
   */
  resultTransformer?: ResultTransformer;
}

/**
 * Field resolver for converting field references to actual query fields
 */
export type FieldResolver = (
  field: string,
  value: unknown,
  context: FieldResolverContext
) => Promise<{ field: string; value: unknown } | null>;

/**
 * Context passed to field resolver
 */
export interface FieldResolverContext {
  userId: string;
  prisma: unknown;
  model: string;
}

/**
 * Result transformer for post-processing query results
 */
export type ResultTransformer = (
  results: Array<Record<string, unknown>>,
  model: string
) => Array<Record<string, unknown>>;

/**
 * Aggregation options for Prisma
 */
export interface PrismaAggregationOptions {
  _sum?: Record<string, boolean>;
  _avg?: Record<string, boolean>;
  _count?: Record<string, boolean> | boolean;
  _min?: Record<string, boolean>;
  _max?: Record<string, boolean>;
}

/**
 * Virtual date fields that require in-memory aggregation
 */
export const VIRTUAL_DATE_FIELDS = [
  "month",
  "year",
  "day",
  "week",
  "quarter",
] as const;

export type VirtualDateField = (typeof VIRTUAL_DATE_FIELDS)[number];

/**
 * Valid aggregation types
 */
export const VALID_AGGREGATION_TYPES = [
  "sum",
  "avg",
  "count",
  "min",
  "max",
] as const;

export type AggregationType = (typeof VALID_AGGREGATION_TYPES)[number];
