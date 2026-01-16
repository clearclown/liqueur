/**
 * Dashboard Generation Prompt Template
 * AI用のプロンプトテンプレート - LiquidView JSON生成
 */

import type { DatabaseMetadata } from "../types";

/**
 * ダッシュボード生成プロンプトを作成
 *
 * @param userRequest - ユーザーのリクエスト（自然言語）
 * @param metadata - データベースメタデータ
 * @returns AIに送信するプロンプト
 */
export function createDashboardPrompt(
  userRequest: string,
  metadata: DatabaseMetadata
): string {
  const tablesInfo = metadata.tables
    .map(
      (table) =>
        `- ${table.name}: ${table.description || "No description"}\n  Columns: ${table.columns.map((c) => `${c.name} (${c.type})`).join(", ")}`
    )
    .join("\n");

  return `You are a dashboard generator for Project Liquid. Your task is to generate a valid LiquidViewSchema JSON based on user requirements.

**CRITICAL RULES:**
1. Output ONLY valid JSON - no explanations, no markdown, no code blocks
2. The JSON must conform to the LiquidViewSchema structure
3. Use ONLY the tables and columns provided in the database metadata
4. data_source resources must match actual table names
5. Never use SQL or arbitrary code - only JSON schema

**Database Metadata:**
${tablesInfo}

**User Request:**
${userRequest}

**Required Output Format:**
{
  "version": "1.0",
  "layout": {
    "type": "grid" | "stack",
    "columns": <number>,
    "gap": <number>
  },
  "components": [
    {
      "type": "chart" | "table",
      "variant": "bar" | "line" | "pie" | "area" (for chart),
      "title": "<string>",
      "data_source": "<string>",
      "x_axis": "<column_name>" (for chart),
      "y_axis": "<column_name>" (for chart),
      "columns": ["<column_name>", ...] (for table)
    }
  ],
  "data_sources": {
    "<name>": {
      "resource": "<table_name>",
      "filters": [
        {
          "field": "<column_name>",
          "op": "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains",
          "value": <value>
        }
      ],
      "aggregation": {
        "type": "sum" | "avg" | "count" | "min" | "max",
        "field": "<column_name>",
        "by": "<column_name>"
      },
      "sort": {
        "field": "<column_name>",
        "direction": "asc" | "desc"
      },
      "limit": <number>
    }
  }
}

**Example:**
User: "Show me sales by month"
Output:
{
  "version": "1.0",
  "layout": {"type": "grid", "columns": 1, "gap": 16},
  "components": [
    {
      "type": "chart",
      "variant": "bar",
      "title": "Sales by Month",
      "data_source": "ds_sales",
      "x_axis": "month",
      "y_axis": "total_amount"
    }
  ],
  "data_sources": {
    "ds_sales": {
      "resource": "sales",
      "aggregation": {"type": "sum", "field": "amount", "by": "month"},
      "sort": {"field": "month", "direction": "asc"}
    }
  }
}

Now generate the JSON for the user's request. Remember: OUTPUT ONLY THE JSON, NOTHING ELSE.`;
}

/**
 * シンプルなダッシュボード生成プロンプト（メタデータなし）
 *
 * @param userRequest - ユーザーのリクエスト
 * @returns AIに送信するプロンプト
 */
export function createSimpleDashboardPrompt(userRequest: string): string {
  return `You are a dashboard generator. Generate a valid LiquidViewSchema JSON for the following request.

**CRITICAL:** Output ONLY valid JSON, no explanations.

**Request:** ${userRequest}

**Required Format:**
{
  "version": "1.0",
  "layout": {"type": "grid", "columns": 2, "gap": 16},
  "components": [...],
  "data_sources": {...}
}

Generate the JSON now:`;
}
