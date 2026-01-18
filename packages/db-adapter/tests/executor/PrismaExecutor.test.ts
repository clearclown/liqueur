/**
 * Tests for PrismaExecutor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaExecutor } from '../../src/executor/PrismaExecutor';
import type { ExecutorConfig } from '../../src/executor/types';
import type { DataSource } from '@liqueur/protocol';

// Mock Prisma client
const createMockPrisma = () => ({
  transaction: {
    findMany: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  },
  category: {
    findMany: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  },
});

describe('PrismaExecutor', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let executor: PrismaExecutor;
  const userId = 'test-user-id';

  const baseConfig: ExecutorConfig = {
    resourceToModel: {
      transactions: 'transaction',
      categories: 'category',
    },
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    executor = new PrismaExecutor(mockPrisma, baseConfig);
  });

  describe('execute - simple queries', () => {
    it('should execute simple query with userId filter (RLS)', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        { id: '1', amount: 100 },
        { id: '2', amount: 200 },
      ]);

      const dataSource: DataSource = {
        resource: 'transactions',
      };

      const result = await executor.execute(dataSource, userId);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: undefined,
        take: undefined,
        include: undefined,
      });
      expect(result).toHaveLength(2);
    });

    it('should throw error for unknown resource', async () => {
      const dataSource: DataSource = {
        resource: 'unknown',
      };

      await expect(executor.execute(dataSource, userId)).rejects.toThrow(
        'Unknown resource: unknown'
      );
    });

    it('should apply filters', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      const dataSource: DataSource = {
        resource: 'transactions',
        filters: [
          { field: 'amount', op: 'gt', value: 100 },
          { field: 'type', op: 'eq', value: 'EXPENSE' },
        ],
      };

      await executor.execute(dataSource, userId);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          amount: { gt: 100 },
          type: 'EXPENSE',
        },
        orderBy: undefined,
        take: undefined,
        include: undefined,
      });
    });

    it('should apply sort', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      const dataSource: DataSource = {
        resource: 'transactions',
        sort: { field: 'date', direction: 'desc' },
      };

      await executor.execute(dataSource, userId);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { date: 'desc' },
        take: undefined,
        include: undefined,
      });
    });

    it('should apply limit', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      const dataSource: DataSource = {
        resource: 'transactions',
        limit: 10,
      };

      await executor.execute(dataSource, userId);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: undefined,
        take: 10,
        include: undefined,
      });
    });
  });

  describe('execute - with config options', () => {
    it('should apply enum mappings', async () => {
      const configWithEnums: ExecutorConfig = {
        ...baseConfig,
        enumMappings: {
          type: {
            expense: 'EXPENSE',
            income: 'INCOME',
          },
        },
      };
      const executorWithEnums = new PrismaExecutor(mockPrisma, configWithEnums);
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      const dataSource: DataSource = {
        resource: 'transactions',
        filters: [{ field: 'type', op: 'eq', value: 'expense' }],
      };

      await executorWithEnums.execute(dataSource, userId);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          type: 'EXPENSE',
        },
        orderBy: undefined,
        take: undefined,
        include: undefined,
      });
    });

    it('should apply date conversion', async () => {
      const configWithDates: ExecutorConfig = {
        ...baseConfig,
        dateFields: ['date'],
      };
      const executorWithDates = new PrismaExecutor(mockPrisma, configWithDates);
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      const dataSource: DataSource = {
        resource: 'transactions',
        filters: [{ field: 'date', op: 'gte', value: '2024-01-01' }],
      };

      await executorWithDates.execute(dataSource, userId);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          date: { gte: '2024-01-01T00:00:00.000Z' },
        },
        orderBy: undefined,
        take: undefined,
        include: undefined,
      });
    });

    it('should apply model includes', async () => {
      const configWithIncludes: ExecutorConfig = {
        ...baseConfig,
        modelIncludes: {
          transaction: { category: true },
        },
      };
      const executorWithIncludes = new PrismaExecutor(mockPrisma, configWithIncludes);
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      const dataSource: DataSource = {
        resource: 'transactions',
      };

      await executorWithIncludes.execute(dataSource, userId);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: undefined,
        take: undefined,
        include: { category: true },
      });
    });

    it('should apply result transformer', async () => {
      const configWithTransformer: ExecutorConfig = {
        ...baseConfig,
        resultTransformer: (results, model) => {
          return results.map((r) => ({ ...r, transformed: true, model }));
        },
      };
      const executorWithTransformer = new PrismaExecutor(mockPrisma, configWithTransformer);
      mockPrisma.transaction.findMany.mockResolvedValue([{ id: '1' }]);

      const dataSource: DataSource = {
        resource: 'transactions',
      };

      const result = await executorWithTransformer.execute(dataSource, userId);

      expect(result).toEqual([{ id: '1', transformed: true, model: 'transaction' }]);
    });

    it('should use field resolver', async () => {
      const configWithResolver: ExecutorConfig = {
        ...baseConfig,
        fieldResolver: vi.fn().mockResolvedValue({
          field: 'categoryId',
          value: 'resolved-id',
        }),
      };
      const executorWithResolver = new PrismaExecutor(mockPrisma, configWithResolver);
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      const dataSource: DataSource = {
        resource: 'transactions',
        filters: [{ field: 'category.name', op: 'eq', value: 'Food' }],
      };

      await executorWithResolver.execute(dataSource, userId);

      expect(configWithResolver.fieldResolver).toHaveBeenCalledWith(
        'category.name',
        'Food',
        { userId, prisma: mockPrisma, model: 'transaction' }
      );
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          categoryId: 'resolved-id',
        },
        orderBy: undefined,
        take: undefined,
        include: undefined,
      });
    });

    it('should skip filter if field resolver returns null', async () => {
      const configWithResolver: ExecutorConfig = {
        ...baseConfig,
        fieldResolver: vi.fn().mockResolvedValue(null),
      };
      const executorWithResolver = new PrismaExecutor(mockPrisma, configWithResolver);
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      const dataSource: DataSource = {
        resource: 'transactions',
        filters: [{ field: 'invalid.field', op: 'eq', value: 'test' }],
      };

      await executorWithResolver.execute(dataSource, userId);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: undefined,
        take: undefined,
        include: undefined,
      });
    });
  });

  describe('execute - aggregation', () => {
    it('should execute simple aggregation without groupBy', async () => {
      mockPrisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 1000 },
      });

      const dataSource: DataSource = {
        resource: 'transactions',
        aggregation: { type: 'sum', field: 'amount' },
      };

      const result = await executor.execute(dataSource, userId);

      expect(mockPrisma.transaction.aggregate).toHaveBeenCalledWith({
        where: { userId },
        _sum: { amount: true },
      });
      expect(result).toEqual([{ amount_sum: 1000 }]);
    });

    it('should throw error for invalid aggregation type', async () => {
      const dataSource: DataSource = {
        resource: 'transactions',
        aggregation: { type: 'invalid' as any, field: 'amount' },
      };

      await expect(executor.execute(dataSource, userId)).rejects.toThrow(
        'Unsupported aggregation type: "invalid"'
      );
    });

    it('should execute groupBy aggregation', async () => {
      mockPrisma.transaction.groupBy.mockResolvedValue([
        { type: 'EXPENSE', _sum: { amount: 500 } },
        { type: 'INCOME', _sum: { amount: 1000 } },
      ]);

      const dataSource: DataSource = {
        resource: 'transactions',
        aggregation: { type: 'sum', field: 'amount', by: 'type' },
      };

      const result = await executor.execute(dataSource, userId);

      expect(mockPrisma.transaction.groupBy).toHaveBeenCalledWith({
        by: ['type'],
        where: { userId },
        _sum: { amount: true },
      });
      expect(result).toHaveLength(2);
    });

    it('should handle virtual date field aggregation (month)', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        { date: new Date('2024-01-15'), amount: 100 },
        { date: new Date('2024-01-20'), amount: 200 },
        { date: new Date('2024-02-10'), amount: 150 },
      ]);

      const dataSource: DataSource = {
        resource: 'transactions',
        aggregation: { type: 'sum', field: 'amount', by: 'month' },
      };

      const result = await executor.execute(dataSource, userId);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { date: true, amount: true },
      });
      expect(result).toEqual([
        { month: '2024-01', amount_sum: 300 },
        { month: '2024-02', amount_sum: 150 },
      ]);
    });
  });

  describe('executeMany', () => {
    it('should execute multiple data sources', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([{ id: '1' }]);
      mockPrisma.category.findMany.mockResolvedValue([{ id: 'cat1' }]);

      const dataSources: Record<string, DataSource> = {
        transactions: { resource: 'transactions' },
        categories: { resource: 'categories' },
      };

      const result = await executor.executeMany(dataSources, userId);

      expect(result).toEqual({
        transactions: [{ id: '1' }],
        categories: [{ id: 'cat1' }],
      });
    });
  });
});
