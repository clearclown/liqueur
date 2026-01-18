/**
 * DataSource Executor Module
 *
 * Provides generic DataSource execution against Prisma
 */

export { PrismaExecutor } from "./PrismaExecutor";
export type {
  ExecutorConfig,
  FieldResolver,
  FieldResolverContext,
  ResultTransformer,
  AggregationType,
  VirtualDateField,
} from "./types";
export {
  VIRTUAL_DATE_FIELDS,
  VALID_AGGREGATION_TYPES,
} from "./types";
export {
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
} from "./utils";
