/**
 * Tests for DataSource Executor Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  convertOperator,
  normalizeDate,
  convertDateValue,
  toNumber,
  extractDatePart,
  aggregateInMemory,
  buildAggregationOptions,
  validateAggregationType,
  isVirtualDateField,
  convertEnumValue,
} from '../../src/executor/utils';

describe('convertOperator', () => {
  it('should return value as-is for eq operator', () => {
    expect(convertOperator('eq', 'test')).toBe('test');
    expect(convertOperator('eq', 42)).toBe(42);
  });

  it('should wrap value in not for neq operator', () => {
    expect(convertOperator('neq', 'test')).toEqual({ not: 'test' });
  });

  it('should wrap value in gt for gt operator', () => {
    expect(convertOperator('gt', 100)).toEqual({ gt: 100 });
  });

  it('should wrap value in gte for gte operator', () => {
    expect(convertOperator('gte', 100)).toEqual({ gte: 100 });
  });

  it('should wrap value in lt for lt operator', () => {
    expect(convertOperator('lt', 100)).toEqual({ lt: 100 });
  });

  it('should wrap value in lte for lte operator', () => {
    expect(convertOperator('lte', 100)).toEqual({ lte: 100 });
  });

  it('should wrap value in in for in operator', () => {
    expect(convertOperator('in', [1, 2, 3])).toEqual({ in: [1, 2, 3] });
  });

  it('should wrap value in contains for contains operator', () => {
    expect(convertOperator('contains', 'test')).toEqual({ contains: 'test' });
  });

  it('should return value as-is for unknown operator', () => {
    expect(convertOperator('unknown' as any, 'test')).toBe('test');
  });
});

describe('normalizeDate', () => {
  it('should return ISO datetime with Z as-is', () => {
    const date = '2024-02-01T12:00:00.000Z';
    expect(normalizeDate(date)).toBe(date);
  });

  it('should return ISO datetime with timezone as-is', () => {
    const date = '2024-02-01T12:00:00+09:00';
    expect(normalizeDate(date)).toBe(date);
  });

  it('should add Z to datetime without timezone', () => {
    expect(normalizeDate('2024-02-01T12:00:00')).toBe('2024-02-01T12:00:00.000Z');
  });

  it('should add Z to datetime with milliseconds but no timezone', () => {
    expect(normalizeDate('2024-02-01T12:00:00.123')).toBe('2024-02-01T12:00:00.123Z');
  });

  it('should add time component to date-only string', () => {
    expect(normalizeDate('2024-02-01')).toBe('2024-02-01T00:00:00.000Z');
  });
});

describe('convertDateValue', () => {
  it('should not convert non-date fields', () => {
    expect(convertDateValue('name', 'test')).toBe('test');
  });

  it('should convert string date values', () => {
    expect(convertDateValue('date', '2024-02-01')).toBe('2024-02-01T00:00:00.000Z');
  });

  it('should convert operator objects with date values', () => {
    expect(convertDateValue('date', { gt: '2024-01-01', lt: '2024-12-31' })).toEqual({
      gt: '2024-01-01T00:00:00.000Z',
      lt: '2024-12-31T00:00:00.000Z',
    });
  });

  it('should handle custom date fields', () => {
    expect(convertDateValue('customDate', '2024-02-01', ['customDate'])).toBe(
      '2024-02-01T00:00:00.000Z'
    );
  });

  it('should not convert non-string values in operator objects', () => {
    expect(convertDateValue('date', { gt: 100 })).toEqual({ gt: 100 });
  });
});

describe('toNumber', () => {
  it('should return number as-is', () => {
    expect(toNumber(42)).toBe(42);
    expect(toNumber(3.14)).toBe(3.14);
  });

  it('should convert string to number', () => {
    expect(toNumber('42')).toBe(42);
    expect(toNumber('3.14')).toBe(3.14);
  });

  it('should handle Decimal-like objects', () => {
    const decimal = { toNumber: () => 123.45 };
    expect(toNumber(decimal)).toBe(123.45);
  });

  it('should return 0 for invalid values', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('invalid')).toBe(0);
  });
});

describe('extractDatePart', () => {
  const testDate = new Date('2024-06-15T12:00:00Z');

  it('should extract year', () => {
    expect(extractDatePart(testDate, 'year')).toBe('2024');
  });

  it('should extract month with padding', () => {
    expect(extractDatePart(testDate, 'month')).toBe('2024-06');
  });

  it('should extract day with padding', () => {
    expect(extractDatePart(testDate, 'day')).toBe('2024-06-15');
  });

  it('should extract week', () => {
    const result = extractDatePart(testDate, 'week');
    expect(result).toMatch(/^2024-W\d{2}$/);
  });

  it('should extract quarter', () => {
    expect(extractDatePart(testDate, 'quarter')).toBe('2024-Q2');
  });

  it('should default to month for unknown part', () => {
    expect(extractDatePart(testDate, 'unknown' as any)).toBe('2024-06');
  });
});

describe('aggregateInMemory', () => {
  const testData = [
    { date: new Date('2024-01-15'), amount: 100 },
    { date: new Date('2024-01-20'), amount: 200 },
    { date: new Date('2024-02-10'), amount: 150 },
  ];

  it('should aggregate with sum', () => {
    const result = aggregateInMemory(testData, 'sum', 'amount', 'month');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ month: '2024-01', amount_sum: 300 });
    expect(result[1]).toEqual({ month: '2024-02', amount_sum: 150 });
  });

  it('should aggregate with avg', () => {
    const result = aggregateInMemory(testData, 'avg', 'amount', 'month');
    expect(result[0]).toEqual({ month: '2024-01', amount_avg: 150 });
    expect(result[1]).toEqual({ month: '2024-02', amount_avg: 150 });
  });

  it('should aggregate with count', () => {
    const result = aggregateInMemory(testData, 'count', 'amount', 'month');
    expect(result[0]).toEqual({ month: '2024-01', amount_count: 2 });
    expect(result[1]).toEqual({ month: '2024-02', amount_count: 1 });
  });

  it('should aggregate with min', () => {
    const result = aggregateInMemory(testData, 'min', 'amount', 'month');
    expect(result[0]).toEqual({ month: '2024-01', amount_min: 100 });
  });

  it('should aggregate with max', () => {
    const result = aggregateInMemory(testData, 'max', 'amount', 'month');
    expect(result[0]).toEqual({ month: '2024-01', amount_max: 200 });
  });

  it('should sort results by date key', () => {
    const unsortedData = [
      { date: new Date('2024-03-01'), amount: 50 },
      { date: new Date('2024-01-01'), amount: 100 },
      { date: new Date('2024-02-01'), amount: 75 },
    ];
    const result = aggregateInMemory(unsortedData, 'sum', 'amount', 'month');
    expect(result[0].month).toBe('2024-01');
    expect(result[1].month).toBe('2024-02');
    expect(result[2].month).toBe('2024-03');
  });
});

describe('buildAggregationOptions', () => {
  it('should build sum options', () => {
    expect(buildAggregationOptions('sum', 'amount')).toEqual({
      _sum: { amount: true },
    });
  });

  it('should build avg options', () => {
    expect(buildAggregationOptions('avg', 'amount')).toEqual({
      _avg: { amount: true },
    });
  });

  it('should build count options', () => {
    expect(buildAggregationOptions('count', 'amount')).toEqual({
      _count: { _all: true },
    });
  });

  it('should build min options', () => {
    expect(buildAggregationOptions('min', 'amount')).toEqual({
      _min: { amount: true },
    });
  });

  it('should build max options', () => {
    expect(buildAggregationOptions('max', 'amount')).toEqual({
      _max: { amount: true },
    });
  });
});

describe('validateAggregationType', () => {
  it('should return true for valid types', () => {
    expect(validateAggregationType('sum')).toBe(true);
    expect(validateAggregationType('avg')).toBe(true);
    expect(validateAggregationType('count')).toBe(true);
    expect(validateAggregationType('min')).toBe(true);
    expect(validateAggregationType('max')).toBe(true);
  });

  it('should return false for invalid types', () => {
    expect(validateAggregationType('invalid')).toBe(false);
    expect(validateAggregationType('SUM')).toBe(false);
    expect(validateAggregationType('')).toBe(false);
  });
});

describe('isVirtualDateField', () => {
  it('should return true for virtual date fields', () => {
    expect(isVirtualDateField('month')).toBe(true);
    expect(isVirtualDateField('year')).toBe(true);
    expect(isVirtualDateField('day')).toBe(true);
    expect(isVirtualDateField('week')).toBe(true);
    expect(isVirtualDateField('quarter')).toBe(true);
  });

  it('should return false for non-virtual fields', () => {
    expect(isVirtualDateField('date')).toBe(false);
    expect(isVirtualDateField('categoryId')).toBe(false);
    expect(isVirtualDateField('Month')).toBe(false);
  });
});

describe('convertEnumValue', () => {
  const enumMappings = {
    type: {
      expense: 'EXPENSE',
      income: 'INCOME',
    },
  };

  it('should convert enum values', () => {
    expect(convertEnumValue('type', 'expense', enumMappings)).toBe('EXPENSE');
    expect(convertEnumValue('type', 'income', enumMappings)).toBe('INCOME');
  });

  it('should return value as-is if no mapping found', () => {
    expect(convertEnumValue('type', 'unknown', enumMappings)).toBe('unknown');
  });

  it('should return value as-is if field has no mappings', () => {
    expect(convertEnumValue('status', 'active', enumMappings)).toBe('active');
  });

  it('should return value as-is if no enum mappings provided', () => {
    expect(convertEnumValue('type', 'expense', undefined)).toBe('expense');
  });

  it('should return non-string values as-is', () => {
    expect(convertEnumValue('type', 123, enumMappings)).toBe(123);
  });
});
