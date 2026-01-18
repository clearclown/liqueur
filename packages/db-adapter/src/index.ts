/**
 * @liqueur/db-adapter
 *
 * Database introspection and execution adapters for Project Liquid
 */

// Introspection
export { PrismaIntrospector } from './introspection/PrismaIntrospector';
export type {
  DatabaseIntrospector,
  DatabaseConnectionOptions,
  IntrospectionOptions,
  PrismaSchema,
  PrismaModel,
  PrismaField,
  PrismaEnum,
} from './types';

// Execution
export { PrismaExecutor } from './executor';
export type {
  ExecutorConfig,
  FieldResolver,
  FieldResolverContext,
  ResultTransformer,
  AggregationType,
  VirtualDateField,
} from './executor';
export {
  VIRTUAL_DATE_FIELDS,
  VALID_AGGREGATION_TYPES,
  convertOperator,
  convertDateValue,
  convertEnumValue,
  normalizeDate,
  toNumber,
  extractDatePart,
  aggregateInMemory,
  buildAggregationOptions,
  validateAggregationType,
  isVirtualDateField,
} from './executor';
