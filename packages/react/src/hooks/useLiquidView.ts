import { useState, useEffect } from 'react';
import type { LiquidViewSchema } from '@liqueur/protocol';
import { generateMockData } from './mockDataGenerator';

export interface UseLiquidViewParams {
  schema: LiquidViewSchema;
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
export function useLiquidView({
  schema,
}: UseLiquidViewParams): UseLiquidViewResult {
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

        // 各data_sourceのモックデータ生成
        const fetchedData: Record<string, unknown[]> = {};
        for (const [name, dataSource] of Object.entries(schema.data_sources)) {
          fetchedData[name] = generateMockData(dataSource);
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
  }, [schema]);

  return { data, loading, error };
}
