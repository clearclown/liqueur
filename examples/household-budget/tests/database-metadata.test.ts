import { describe, it, expect } from 'vitest';
import { householdBudgetMetadata, householdBudgetHints } from '../lib/database-metadata';

describe('householdBudgetMetadata', () => {
  it('should have required tables', () => {
    const tableNames = householdBudgetMetadata.tables.map((t) => t.name);
    expect(tableNames).toContain('transactions');
    expect(tableNames).toContain('categories');
    expect(tableNames).toContain('budgets');
  });

  it('should have proper columns for transactions table', () => {
    const transactionsTable = householdBudgetMetadata.tables.find(
      (t) => t.name === 'transactions'
    );
    expect(transactionsTable).toBeDefined();

    const columnNames = transactionsTable!.columns.map((c) => c.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('amount');
    expect(columnNames).toContain('type');
    expect(columnNames).toContain('date');
    expect(columnNames).toContain('categoryId');
    expect(columnNames).toContain('userId');
  });

  it('should have proper columns for categories table', () => {
    const categoriesTable = householdBudgetMetadata.tables.find(
      (t) => t.name === 'categories'
    );
    expect(categoriesTable).toBeDefined();

    const columnNames = categoriesTable!.columns.map((c) => c.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('type');
    expect(columnNames).toContain('icon');
    expect(columnNames).toContain('color');
  });

  it('should have proper relations', () => {
    expect(householdBudgetMetadata.relations.length).toBeGreaterThan(0);

    const transactionCategoryRelation = householdBudgetMetadata.relations.find(
      (r) => r.name === 'transaction_category'
    );
    expect(transactionCategoryRelation).toBeDefined();
    expect(transactionCategoryRelation!.fromTable).toBe('transactions');
    expect(transactionCategoryRelation!.toTable).toBe('categories');
    expect(transactionCategoryRelation!.type).toBe('many-to-one');
  });

  it('should have enum definitions', () => {
    expect(householdBudgetMetadata.enums).toBeDefined();
    expect(householdBudgetMetadata.enums!.length).toBeGreaterThan(0);

    const categoryTypeEnum = householdBudgetMetadata.enums!.find(
      (e) => e.name === 'CategoryType'
    );
    expect(categoryTypeEnum).toBeDefined();
    expect(categoryTypeEnum!.values).toContain('EXPENSE');
    expect(categoryTypeEnum!.values).toContain('INCOME');
  });
});

describe('householdBudgetHints', () => {
  it('should have helpful hints', () => {
    expect(householdBudgetHints.length).toBeGreaterThan(0);
  });

  it('should contain currency hint', () => {
    const currencyHint = householdBudgetHints.find((h) => h.includes('円'));
    expect(currencyHint).toBeDefined();
  });

  it('should contain filter hints', () => {
    const expenseHint = householdBudgetHints.find((h) => h.includes('EXPENSE'));
    const incomeHint = householdBudgetHints.find((h) => h.includes('INCOME'));
    expect(expenseHint).toBeDefined();
    expect(incomeHint).toBeDefined();
  });
});
