/**
 * Prisma DataSource Executor
 *
 * Generic executor for DataSource queries against Prisma
 */

import type { DataSource } from "@liqueur/protocol";
import type {
  ExecutorConfig,
  AggregationType,
  VirtualDateField,
} from "./types";
import {
  convertOperator,
  convertDateValue,
  convertEnumValue,
  toNumber,
  aggregateInMemory,
  buildAggregationOptions,
  validateAggregationType,
  isVirtualDateField,
} from "./utils";

/**
 * PrismaExecutor - Execute DataSource queries against Prisma
 *
 * This is a generic executor that can be configured for different applications.
 * Application-specific logic (enum mappings, field resolvers) is passed via config.
 */
export class PrismaExecutor {
  private config: ExecutorConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private prisma: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(prisma: any, config: ExecutorConfig) {
    this.prisma = prisma;
    this.config = config;
  }

  /**
   * Execute a single DataSource query with Row-Level Security
   */
  async execute(
    dataSource: DataSource,
    userId: string
  ): Promise<unknown[]> {
    const { resource, filters = [], aggregation, sort, limit } = dataSource;

    const model = this.config.resourceToModel[resource];
    if (!model) {
      throw new Error(`Unknown resource: ${resource}`);
    }

    // Row-Level Security: Always filter by userId
    const where: Record<string, unknown> = { userId };

    // Convert filters
    for (const filter of filters) {
      let field = filter.field;
      let value: unknown = filter.value;

      // Use custom field resolver if provided
      if (this.config.fieldResolver) {
        const resolved = await this.config.fieldResolver(field, value, {
          userId,
          prisma: this.prisma,
          model,
        });
        if (resolved === null) {
          // Field resolver returned null, skip this filter
          continue;
        }
        field = resolved.field;
        value = resolved.value;
      }

      // Apply enum conversion
      value = convertEnumValue(field, value, this.config.enumMappings);

      // Apply date conversion
      value = convertDateValue(field, value, this.config.dateFields);

      // Convert operator to Prisma condition
      where[field] = convertOperator(filter.op, value);
    }

    // Execute aggregation query
    if (aggregation) {
      return this.executeAggregation(model, where, aggregation, sort, limit);
    }

    // Execute simple query
    const prismaModel = this.prisma[model];

    const results = await prismaModel.findMany({
      where,
      orderBy: sort ? { [sort.field]: sort.direction } : undefined,
      take: limit,
      include: this.config.modelIncludes?.[model],
    });

    // Apply result transformer if provided
    if (this.config.resultTransformer) {
      return this.config.resultTransformer(results, model);
    }

    return results;
  }

  /**
   * Execute multiple DataSources
   */
  async executeMany(
    dataSources: Record<string, DataSource>,
    userId: string
  ): Promise<Record<string, unknown[]>> {
    const results: Record<string, unknown[]> = {};

    for (const [key, dataSource] of Object.entries(dataSources)) {
      results[key] = await this.execute(dataSource, userId);
    }

    return results;
  }

  /**
   * Execute aggregation query
   */
  private async executeAggregation(
    model: string,
    where: Record<string, unknown>,
    aggregation: NonNullable<DataSource["aggregation"]>,
    sort?: DataSource["sort"],
    limit?: number
  ): Promise<unknown[]> {
    const { type, field, by } = aggregation;

    // Validate aggregation type
    if (!validateAggregationType(type)) {
      throw new Error(
        `Unsupported aggregation type: "${type}". Valid types are: sum, avg, count, min, max`
      );
    }

    const aggOptions = buildAggregationOptions(type as AggregationType, field);

    // If no groupBy field, return simple aggregation
    if (!by) {
      const prismaModel = this.prisma[model];
      const aggResult = await prismaModel.aggregate({
        where,
        ...aggOptions,
      });

      const aggValue =
        aggResult[`_${type}`]?.[field] ?? aggResult._count?._all;
      return [{ [`${field}_${type}`]: aggValue }];
    }

    const prismaModel = this.prisma[model];

    // Handle virtual date fields (month, year, day, week, quarter)
    if (isVirtualDateField(by)) {
      // Fetch all matching data and aggregate in JavaScript
      const data = await prismaModel.findMany({
        where,
        select: { date: true, [field]: true },
      });

      let results = aggregateInMemory(
        data,
        type as AggregationType,
        field,
        by as VirtualDateField
      );

      // Apply sorting
      if (sort) {
        const sortField =
          sort.field === `${field}_${type}` ? `${field}_${type}` : by;
        results.sort((a, b) => {
          const aVal = a[sortField];
          const bVal = b[sortField];
          if (typeof aVal === "number" && typeof bVal === "number") {
            return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
          }
          return sort.direction === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        });
      }

      // Apply limit
      if (limit) {
        results = results.slice(0, limit);
      }

      return results;
    }

    // Handle regular groupBy
    const groupByField = by.includes(".") ? by.split(".")[0] + "Id" : by;

    // Build groupBy query options
    const groupByOptions: Record<string, unknown> = {
      by: [groupByField],
      where,
      ...aggOptions,
    };

    if (sort) {
      groupByOptions.orderBy = { [`_${type}`]: { [field]: sort.direction } };
    }
    if (limit) {
      groupByOptions.take = limit;
    }

    const result = (await prismaModel.groupBy(
      groupByOptions
    )) as Array<Record<string, unknown>>;

    // Normalize result
    return result.map((row) => {
      const aggValue =
        (row[`_${type}`] as Record<string, unknown>)?.[field] ??
        (row._count as unknown);
      return {
        [by]: row[groupByField] ?? row[by],
        [`${field}_${type}`]: toNumber(aggValue),
      };
    });
  }
}
