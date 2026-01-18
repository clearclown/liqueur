import { prisma } from './prisma';
import type { DataSource, FilterOperator } from '@liqueur/protocol';

type PrismaModel = 'transaction' | 'category' | 'budget';

const resourceToModel: Record<string, PrismaModel> = {
  transactions: 'transaction',
  categories: 'category',
  budgets: 'budget',
};

/**
 * Execute a DataSource query with Row-Level Security
 */
export async function executeDataSource(
  dataSource: DataSource,
  userId: string
): Promise<unknown[]> {
  const { resource, filters = [], aggregation, sort, limit } = dataSource;

  const model = resourceToModel[resource];
  if (!model) {
    throw new Error(`Unknown resource: ${resource}`);
  }

  // Row-Level Security: Always filter by userId
  const where: Record<string, unknown> = { userId };

  // Convert filters
  for (const filter of filters) {
    const field = filter.field.replace('category.', '');
    where[field] = convertOperator(filter.op, filter.value);
  }

  // Execute aggregation query
  if (aggregation) {
    return executeAggregation(model, where, aggregation, sort, limit);
  }

  // Execute simple query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaModel = prisma[model] as any;

  return prismaModel.findMany({
    where,
    orderBy: sort ? { [sort.field]: sort.direction } : undefined,
    take: limit,
    include: getIncludes(model),
  }) as Promise<unknown[]>;
}

function convertOperator(op: FilterOperator, value: unknown): unknown {
  switch (op) {
    case 'eq':
      return value;
    case 'neq':
      return { not: value };
    case 'gt':
      return { gt: value };
    case 'gte':
      return { gte: value };
    case 'lt':
      return { lt: value };
    case 'lte':
      return { lte: value };
    case 'in':
      return { in: value };
    case 'contains':
      return { contains: value };
    default:
      return value;
  }
}

async function executeAggregation(
  model: PrismaModel,
  where: Record<string, unknown>,
  aggregation: NonNullable<DataSource['aggregation']>,
  sort?: DataSource['sort'],
  limit?: number
): Promise<unknown[]> {
  const { type, field, by } = aggregation;

  // If no groupBy field, return simple aggregation
  if (!by) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaModel = prisma[model] as any;
    const aggResult = await prismaModel.aggregate({
      where,
      _sum: type === 'sum' ? { [field]: true } : undefined,
      _avg: type === 'avg' ? { [field]: true } : undefined,
      _count: type === 'count' ? { _all: true } : undefined,
      _min: type === 'min' ? { [field]: true } : undefined,
      _max: type === 'max' ? { [field]: true } : undefined,
    });

    const aggValue = aggResult[`_${type}`]?.[field] ?? aggResult._count?._all;
    return [{ [`${field}_${type}`]: aggValue }];
  }

  // Handle category grouping
  const groupByField = by.includes('.') ? 'categoryId' : by;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaModel = prisma[model] as any;

  const result = (await prismaModel.groupBy({
    by: [groupByField],
    where,
    _sum: type === 'sum' ? { [field]: true } : undefined,
    _avg: type === 'avg' ? { [field]: true } : undefined,
    _count: type === 'count' ? { [field]: true } : undefined,
    _min: type === 'min' ? { [field]: true } : undefined,
    _max: type === 'max' ? { [field]: true } : undefined,
    orderBy: sort
      ? { [`_${type}`]: { [field]: sort.direction } }
      : undefined,
    take: limit,
  })) as Array<Record<string, unknown>>;

  // If grouping by category, fetch category names
  if (by === 'category.name' || by === 'categoryId') {
    const categoryIds = result.map((row) => row.categoryId as string);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return result.map((row) => {
      const category = categoryMap.get(row.categoryId as string);
      const aggValue =
        (row[`_${type}`] as Record<string, unknown>)?.[field] ??
        (row._count as unknown);
      return {
        [by === 'category.name' ? 'name' : by]: category?.name ?? row[groupByField],
        [`${field}_${type}`]: aggValue,
        color: category?.color,
      };
    });
  }

  // Normalize result
  return result.map((row) => {
    const aggValue =
      (row[`_${type}`] as Record<string, unknown>)?.[field] ??
      (row._count as unknown);
    return {
      [by]: row[by],
      [`${field}_${type}`]: aggValue,
    };
  });
}

function getIncludes(model: PrismaModel): Record<string, boolean> | undefined {
  if (model === 'transaction') {
    return { category: true };
  }
  if (model === 'budget') {
    return { category: true };
  }
  return undefined;
}

/**
 * Execute multiple data sources
 */
export async function executeDataSources(
  dataSources: Record<string, DataSource>,
  userId: string
): Promise<Record<string, unknown[]>> {
  const results: Record<string, unknown[]> = {};

  for (const [key, dataSource] of Object.entries(dataSources)) {
    results[key] = await executeDataSource(dataSource, userId);
  }

  return results;
}
