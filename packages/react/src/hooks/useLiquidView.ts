import { useState, useEffect } from "react";
import type { LiquidViewSchema, DataSource } from "@liqueur/protocol";
import { generateMockData } from "./mockDataGenerator";

/**
 * Fetch data from the backend API
 */
async function fetchDataFromAPI(dataSource: DataSource): Promise<unknown[]> {
  const response = await fetch('/api/liquid/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataSource }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

export interface UseLiquidViewParams {
  schema: LiquidViewSchema;
  /** Use mock data instead of real API (default: true for Phase 1) */
  useMockData?: boolean;
}

export interface UseLiquidViewResult {
  /** Data mapped by data_source name */
  data: Record<string, unknown[]>;
  /** Loading state */
  loading: boolean;
  /** Error if any occurred */
  error: Error | null;
}

/**
 * useLiquidView - LiquidViewスキーマからデータをフェッチ
 * Phase 1: モックデータ生成
 * Phase 2: 実API統合
 */
export function useLiquidView({ schema, useMockData = true }: UseLiquidViewParams): UseLiquidViewResult {
  const [data, setData] = useState<Record<string, unknown[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 空のdata_sources処理
        if (Object.keys(schema.data_sources).length === 0) {
          setData({});
          return;
        }

        // 各data_sourceのデータ取得（モック or 実API）
        const fetchedData: Record<string, unknown[]> = {};
        for (const [name, dataSource] of Object.entries(schema.data_sources)) {
          if (useMockData) {
            fetchedData[name] = generateMockData(dataSource);
          } else {
            fetchedData[name] = await fetchDataFromAPI(dataSource);
          }
        }

        setData(fetchedData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setData({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schema, useMockData]);

  return { data, loading, error };
}
