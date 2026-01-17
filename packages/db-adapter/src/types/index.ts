/**
 * Database Adapter Types
 */

import type { DatabaseMetadata, Table, Column } from "@liqueur/protocol";

/**
 * Database introspector interface
 */
export interface DatabaseIntrospector {
  /**
   * Get database metadata (tables, columns, relations)
   */
  getMetadata(): Promise<DatabaseMetadata>;

  /**
   * Get specific table information
   */
  getTable(tableName: string): Promise<Table | null>;

  /**
   * Check if introspector is available (dependencies installed)
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Prisma schema representation
 */
export interface PrismaSchema {
  models: PrismaModel[];
  enums: PrismaEnum[];
}

export interface PrismaModel {
  name: string;
  fields: PrismaField[];
  documentation?: string;
}

export interface PrismaField {
  name: string;
  type: string;
  isRequired: boolean;
  isList: boolean;
  isId: boolean;
  isUnique: boolean;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
  default?: any;
  documentation?: string;
}

export interface PrismaEnum {
  name: string;
  values: string[];
}

/**
 * Database connection options
 */
export interface DatabaseConnectionOptions {
  /**
   * Database URL (e.g., postgresql://user:pass@localhost:5432/db)
   */
  url?: string;

  /**
   * Schema name (for PostgreSQL, MySQL)
   */
  schema?: string;

  /**
   * Path to Prisma schema file
   */
  prismaSchemaPath?: string;
}

/**
 * Introspection options
 */
export interface IntrospectionOptions {
  /**
   * Include sample data for each table
   */
  includeSampleData?: boolean;

  /**
   * Number of sample rows per table
   */
  sampleSize?: number;

  /**
   * Tables to exclude
   */
  excludeTables?: string[];

  /**
   * Tables to include (if specified, only these tables)
   */
  includeTables?: string[];
}
