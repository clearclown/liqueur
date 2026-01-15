import type { DataSource } from '@liqueur/protocol';

/**
 * リソースベースのモックデータテンプレート
 */
const MOCK_TEMPLATES: Record<string, () => unknown[]> = {
  sales: () => [
    { month: 'Jan', amount: 12000 },
    { month: 'Feb', amount: 15000 },
    { month: 'Mar', amount: 13500 },
    { month: 'Apr', amount: 18000 },
    { month: 'May', amount: 16500 },
    { month: 'Jun', amount: 19000 },
    { month: 'Jul', amount: 21000 },
    { month: 'Aug', amount: 17500 },
    { month: 'Sep', amount: 16000 },
    { month: 'Oct', amount: 18500 },
    { month: 'Nov', amount: 20000 },
    { month: 'Dec', amount: 22000 },
  ],

  users: () => [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User' },
    { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'User' },
    { id: 4, name: 'Diana Prince', email: 'diana@example.com', role: 'Manager' },
    { id: 5, name: 'Eve Davis', email: 'eve@example.com', role: 'User' },
    { id: 6, name: 'Frank Miller', email: 'frank@example.com', role: 'User' },
    { id: 7, name: 'Grace Lee', email: 'grace@example.com', role: 'Admin' },
    { id: 8, name: 'Henry Wilson', email: 'henry@example.com', role: 'User' },
    { id: 9, name: 'Ivy Chen', email: 'ivy@example.com', role: 'Manager' },
    { id: 10, name: 'Jack Robinson', email: 'jack@example.com', role: 'User' },
  ],

  expenses: () => [
    { date: '2024-01-15', category: 'Food', amount: 45.50, merchant: 'Restaurant A' },
    { date: '2024-01-20', category: 'Travel', amount: 120.00, merchant: 'Airline B' },
    { date: '2024-02-05', category: 'Office', amount: 89.99, merchant: 'Supplier C' },
    { date: '2024-02-10', category: 'Food', amount: 32.00, merchant: 'Cafe D' },
    { date: '2024-03-01', category: 'Entertainment', amount: 75.00, merchant: 'Cinema E' },
    { date: '2024-03-15', category: 'Travel', amount: 250.00, merchant: 'Hotel F' },
    { date: '2024-04-05', category: 'Office', amount: 150.00, merchant: 'Supplier G' },
    { date: '2024-04-20', category: 'Food', amount: 55.25, merchant: 'Restaurant H' },
  ],

  // ジェネリックフォールバック
  default: () => [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
    { id: 3, name: 'Item 3', value: 150 },
    { id: 4, name: 'Item 4', value: 300 },
    { id: 5, name: 'Item 5', value: 250 },
  ],
};

/**
 * DataSourceからモックデータを生成
 * Phase 1: limitのみ適用
 * Phase 2: filters, aggregation, sortをバックエンドで処理
 */
export function generateMockData(dataSource: DataSource): unknown[] {
  // バリデーション
  if (!dataSource.resource || dataSource.resource.trim() === '') {
    throw new Error('Resource name cannot be empty');
  }

  const resource = dataSource.resource.toLowerCase();

  let data: unknown[];

  // 完全一致チェック
  if (MOCK_TEMPLATES[resource]) {
    data = MOCK_TEMPLATES[resource]();
    return applyLimit(data, dataSource.limit);
  }

  // 部分一致チェック (例: "monthly_sales" → "sales")
  for (const [key, generator] of Object.entries(MOCK_TEMPLATES)) {
    if (key !== 'default' && resource.includes(key)) {
      data = generator();
      return applyLimit(data, dataSource.limit);
    }
  }

  // フォールバック
  data = MOCK_TEMPLATES.default();
  return applyLimit(data, dataSource.limit);
}

/**
 * limitを適用（Phase 1で唯一のDataSource処理）
 */
function applyLimit(data: unknown[], limit?: number): unknown[] {
  if (limit !== undefined && limit >= 0) {
    return data.slice(0, limit);
  }
  return data;
}
