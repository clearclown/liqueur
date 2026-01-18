import type { DatabaseMetadata } from '@liqueur/protocol';

export const householdBudgetMetadata: DatabaseMetadata = {
  tables: [
    {
      name: 'transactions',
      description: '支出・収入の取引記録',
      columns: [
        { name: 'id', type: 'string', nullable: false, primaryKey: true, description: '取引ID' },
        { name: 'amount', type: 'decimal', nullable: false, description: '金額（円）' },
        { name: 'type', type: 'string', nullable: false, description: 'EXPENSE（支出）またはINCOME（収入）' },
        { name: 'description', type: 'string', nullable: true, description: '取引の説明' },
        { name: 'date', type: 'datetime', nullable: false, description: '取引日' },
        { name: 'categoryId', type: 'string', nullable: false, description: 'カテゴリID' },
        { name: 'userId', type: 'string', nullable: false, description: 'ユーザーID' },
        { name: 'createdAt', type: 'datetime', nullable: false, description: '作成日時' },
        { name: 'updatedAt', type: 'datetime', nullable: false, description: '更新日時' },
      ],
    },
    {
      name: 'categories',
      description: '支出・収入のカテゴリ',
      columns: [
        { name: 'id', type: 'string', nullable: false, primaryKey: true, description: 'カテゴリID' },
        { name: 'name', type: 'string', nullable: false, description: 'カテゴリ名（食費、交通費など）' },
        { name: 'type', type: 'string', nullable: false, description: 'EXPENSE（支出）またはINCOME（収入）' },
        { name: 'icon', type: 'string', nullable: true, description: '絵文字アイコン' },
        { name: 'color', type: 'string', nullable: true, description: '表示色（HEX）' },
        { name: 'userId', type: 'string', nullable: false, description: 'ユーザーID' },
        { name: 'createdAt', type: 'datetime', nullable: false, description: '作成日時' },
      ],
    },
    {
      name: 'budgets',
      description: 'カテゴリ別の月間予算',
      columns: [
        { name: 'id', type: 'string', nullable: false, primaryKey: true, description: '予算ID' },
        { name: 'amount', type: 'decimal', nullable: false, description: '予算額（円）' },
        { name: 'month', type: 'datetime', nullable: false, description: '対象月' },
        { name: 'categoryId', type: 'string', nullable: false, description: 'カテゴリID' },
        { name: 'userId', type: 'string', nullable: false, description: 'ユーザーID' },
        { name: 'createdAt', type: 'datetime', nullable: false, description: '作成日時' },
      ],
    },
  ],
  relations: [
    {
      name: 'transaction_category',
      fromTable: 'transactions',
      fromColumn: 'categoryId',
      toTable: 'categories',
      toColumn: 'id',
      type: 'many-to-one',
    },
    {
      name: 'budget_category',
      fromTable: 'budgets',
      fromColumn: 'categoryId',
      toTable: 'categories',
      toColumn: 'id',
      type: 'many-to-one',
    },
  ],
  enums: [
    {
      name: 'CategoryType',
      values: ['EXPENSE', 'INCOME'],
    },
    {
      name: 'TransactionType',
      values: ['EXPENSE', 'INCOME'],
    },
  ],
};

/**
 * AI hints for better schema generation
 */
export const householdBudgetHints = [
  '金額は日本円（JPY）で表示してください',
  'カテゴリ別の集計には category.name を使用してください',
  '月別の集計には date フィールドを month でグループ化してください',
  '支出のみを表示する場合は type = "EXPENSE" でフィルタしてください',
  '収入のみを表示する場合は type = "INCOME" でフィルタしてください',
  '円グラフは構成比の表示に適しています',
  '折れ線グラフは推移の表示に適しています',
  '棒グラフは比較の表示に適しています',
  'テーブルは一覧表示に適しています',
];
