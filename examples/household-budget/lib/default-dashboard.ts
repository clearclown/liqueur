import type { LiquidViewSchema } from '@liqueur/protocol';

/**
 * デフォルトダッシュボードスキーマ
 * アプリ初期表示時に使用される基本的な家計分析ダッシュボード
 */
export const defaultDashboardSchema: LiquidViewSchema = {
  version: "1.0",
  layout: { type: "grid", columns: 2 },
  components: [
    {
      type: "chart",
      variant: "pie",
      title: "今月の支出内訳",
      data_source: "expense_by_category",
    },
    {
      type: "chart",
      variant: "line",
      title: "月別支出推移",
      data_source: "monthly_expenses",
    },
    {
      type: "chart",
      variant: "bar",
      title: "カテゴリ別比較（上位5件）",
      data_source: "category_comparison",
    },
    {
      type: "table",
      title: "最近の取引",
      columns: ["date", "description", "category", "amount"],
      data_source: "recent_transactions",
    },
  ],
  data_sources: {
    expense_by_category: {
      resource: "transactions",
      filters: [{ field: "type", op: "eq", value: "EXPENSE" }],
      aggregation: { type: "sum", field: "amount", by: "category.name" },
    },
    monthly_expenses: {
      resource: "transactions",
      filters: [{ field: "type", op: "eq", value: "EXPENSE" }],
      aggregation: { type: "sum", field: "amount", by: "month" },
    },
    category_comparison: {
      resource: "transactions",
      filters: [{ field: "type", op: "eq", value: "EXPENSE" }],
      aggregation: { type: "sum", field: "amount", by: "category.name" },
      sort: { field: "amount", direction: "desc" },
      limit: 5,
    },
    recent_transactions: {
      resource: "transactions",
      sort: { field: "date", direction: "desc" },
      limit: 10,
    },
  },
};
