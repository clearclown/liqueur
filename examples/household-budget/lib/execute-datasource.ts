/**
 * DataSource Executor for Household Budget App
 *
 * Uses @liqueur/db-adapter's PrismaExecutor with app-specific configuration
 */

import { prisma } from './prisma';
import type { DataSource } from '@liqueur/protocol';
import { TransactionType, CategoryType } from '@prisma/client';
import {
  PrismaExecutor,
  type ExecutorConfig,
  type FieldResolverContext,
  toNumber,
} from '@liqueur/db-adapter';

// ============================================
// App-specific Configuration
// ============================================

/**
 * Resource to Prisma model mapping
 */
const resourceToModel: Record<string, string> = {
  transactions: 'transaction',
  categories: 'category',
  budgets: 'budget',
};

/**
 * Enum field mappings for type conversion (including Japanese terms)
 */
const enumMappings: Record<string, Record<string, unknown>> = {
  type: {
    expense: TransactionType.EXPENSE,
    income: TransactionType.INCOME,
    EXPENSE: TransactionType.EXPENSE,
    INCOME: TransactionType.INCOME,
    // Japanese terms
    '支出': TransactionType.EXPENSE,
    '収入': TransactionType.INCOME,
    '費用': TransactionType.EXPENSE,
    '経費': TransactionType.EXPENSE,
  },
  categoryType: {
    expense: CategoryType.EXPENSE,
    income: CategoryType.INCOME,
    EXPENSE: CategoryType.EXPENSE,
    INCOME: CategoryType.INCOME,
    // Japanese terms
    '支出': CategoryType.EXPENSE,
    '収入': CategoryType.INCOME,
  },
};

/**
 * Category name mappings (Japanese and English)
 */
const categoryNameMappings: Record<string, string[]> = {
  '食費': ['食費', 'food', 'foods', '食事'],
  '交通費': ['交通費', 'transport', 'transportation', '交通'],
  '住居費': ['住居費', 'housing', 'rent', '家賃', '住居'],
  '光熱費': ['光熱費', 'utilities', 'utility', '電気', 'ガス', '水道'],
  '通信費': ['通信費', 'communication', 'phone', '携帯', 'インターネット'],
  '娯楽費': ['娯楽費', 'entertainment', '娯楽', 'レジャー'],
  '衣服費': ['衣服費', 'clothing', 'clothes', '衣服', '服'],
  '給与': ['給与', 'salary', 'income', '収入'],
};

/**
 * Convert category name/alias to actual category name
 */
function normalizeCategoryName(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const lowerValue = value.toLowerCase();
  for (const [categoryName, aliases] of Object.entries(categoryNameMappings)) {
    if (aliases.some(alias => alias.toLowerCase() === lowerValue)) {
      return categoryName;
    }
  }
  return null;
}

/**
 * Field resolver for handling category.name lookups
 */
async function fieldResolver(
  field: string,
  value: unknown,
  context: FieldResolverContext
): Promise<{ field: string; value: unknown } | null> {
  const { userId } = context;

  // Handle category.name filtering - convert to categoryId lookup
  if (field === 'category.name' || field === 'categoryId.name') {
    const categoryName = typeof value === 'string'
      ? (normalizeCategoryName(value) ?? value)
      : value;

    // Find category by name
    const category = await prisma.category.findFirst({
      where: { userId, name: categoryName as string },
      select: { id: true },
    });

    if (category) {
      return { field: 'categoryId', value: category.id };
    } else {
      // Category not found, skip this filter
      return null;
    }
  }

  // Handle categoryId filtering by name (legacy support)
  if (field === 'categoryId' && typeof value === 'string') {
    const categoryName = normalizeCategoryName(value);
    if (categoryName) {
      const category = await prisma.category.findFirst({
        where: { userId, name: categoryName },
        select: { id: true },
      });
      if (category) {
        return { field: 'categoryId', value: category.id };
      }
    }
  }

  return { field, value };
}

/**
 * Result transformer for flattening nested objects
 */
function resultTransformer(
  results: Array<Record<string, unknown>>,
  model: string
): Array<Record<string, unknown>> {
  if (model !== 'transaction' && model !== 'budget') {
    return results;
  }

  return results.map((row) => {
    const flattened: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
      if (key === 'category' && value && typeof value === 'object') {
        // Flatten category object
        const category = value as { name?: string; color?: string; type?: string };
        flattened['category'] = category.name ?? '';
        flattened['category_name'] = category.name ?? '';
        flattened['category_color'] = category.color ?? '';
        flattened['category_type'] = category.type ?? '';
      } else if (value && typeof value === 'object' && 'toNumber' in value) {
        // Convert Decimal to number
        flattened[key] = (value as { toNumber: () => number }).toNumber();
      } else {
        flattened[key] = value;
      }
    }

    return flattened;
  });
}

// ============================================
// Executor Configuration
// ============================================

const executorConfig: ExecutorConfig = {
  resourceToModel,
  enumMappings,
  dateFields: ['date', 'createdAt', 'updatedAt', 'month'],
  fieldResolver,
  modelIncludes: {
    transaction: { category: true },
    budget: { category: true },
  },
  resultTransformer,
};

// Create executor instance
const executor = new PrismaExecutor(prisma, executorConfig);

// ============================================
// Extended Aggregation Support (Category grouping)
// ============================================

/**
 * Execute a DataSource query with Row-Level Security
 * Extended version that handles category grouping
 */
export async function executeDataSource(
  dataSource: DataSource,
  userId: string
): Promise<unknown[]> {
  const { aggregation } = dataSource;

  // Special handling for category grouping (requires lookup)
  if (aggregation?.by === 'category.name' || aggregation?.by === 'categoryId') {
    return executeWithCategoryGrouping(dataSource, userId);
  }

  // Use standard executor for everything else
  return executor.execute(dataSource, userId);
}

/**
 * Handle aggregation with category grouping
 */
async function executeWithCategoryGrouping(
  dataSource: DataSource,
  userId: string
): Promise<unknown[]> {
  const { resource, filters = [], aggregation, sort, limit } = dataSource;

  const model = resourceToModel[resource];
  if (!model) {
    throw new Error(`Unknown resource: ${resource}`);
  }

  if (!aggregation) {
    throw new Error('Aggregation required for category grouping');
  }

  const { type, field, by } = aggregation;

  // Validate aggregation type
  const validTypes = ['sum', 'avg', 'count', 'min', 'max'];
  if (!validTypes.includes(type)) {
    throw new Error(`Unsupported aggregation type: "${type}". Valid types are: ${validTypes.join(', ')}`);
  }

  // Build where clause with RLS
  const where: Record<string, unknown> = { userId };

  for (const filter of filters) {
    let filterField = filter.field;
    let filterValue: unknown = filter.value;

    // Resolve field
    const resolved = await fieldResolver(filterField, filterValue, { userId, prisma, model });
    if (resolved === null) continue;
    filterField = resolved.field;
    filterValue = resolved.value;

    // Apply enum conversion
    if (typeof filterValue === 'string' && enumMappings[filterField]) {
      filterValue = enumMappings[filterField][filterValue] ?? filterValue;
    }

    // Convert operator
    const opMap: Record<string, unknown> = {
      eq: filterValue,
      neq: { not: filterValue },
      gt: { gt: filterValue },
      gte: { gte: filterValue },
      lt: { lt: filterValue },
      lte: { lte: filterValue },
      in: { in: filterValue },
      contains: { contains: filterValue },
    };
    where[filterField] = opMap[filter.op] ?? filterValue;
  }

  // Build aggregation options
  const aggOptions: Record<string, Record<string, boolean>> = {};
  if (type === 'sum') aggOptions._sum = { [field]: true };
  else if (type === 'avg') aggOptions._avg = { [field]: true };
  else if (type === 'count') aggOptions._count = { _all: true };
  else if (type === 'min') aggOptions._min = { [field]: true };
  else if (type === 'max') aggOptions._max = { [field]: true };

  // Build groupBy query
  const groupByField = 'categoryId';
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaModel = prisma[model as keyof typeof prisma] as any;
  const result = (await prismaModel.groupBy(groupByOptions)) as Array<Record<string, unknown>>;

  // Fetch category names
  const categoryIds = result.map((row) => row.categoryId as string);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Map results with category names
  return result.map((row) => {
    const category = categoryMap.get(row.categoryId as string);
    const aggValue =
      (row[`_${type}`] as Record<string, unknown>)?.[field] ??
      (row._count as unknown);
    return {
      [by === 'category.name' ? 'name' : by!]: category?.name ?? row[groupByField],
      [`${field}_${type}`]: toNumber(aggValue),
      color: category?.color,
    };
  });
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
