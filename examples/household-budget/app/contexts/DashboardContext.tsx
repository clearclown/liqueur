'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { LiquidViewSchema } from '@liqueur/protocol';
import { useSchemaHistory, type SchemaHistoryReturn } from '../hooks/useSchemaHistory';
import { defaultDashboardSchema } from '@/lib/default-dashboard';

interface DashboardContextType extends SchemaHistoryReturn {
  /** データソースから取得したデータ */
  data: Record<string, unknown[]>;
  /** データ読み込み中フラグ */
  loading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** データを再取得 */
  refreshData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

interface DashboardProviderProps {
  children: React.ReactNode;
  initialSchema?: LiquidViewSchema;
}

export function DashboardProvider({ children, initialSchema }: DashboardProviderProps) {
  const schemaHistory = useSchemaHistory(initialSchema ?? defaultDashboardSchema);
  const [data, setData] = useState<Record<string, unknown[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (schema: LiquidViewSchema) => {
    if (!schema.data_sources || Object.keys(schema.data_sources).length === 0) {
      setData({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/liquid/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSources: schema.data_sources }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'データの取得に失敗しました');
      }

      const { data: newData } = await res.json();
      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
      setData({});
    } finally {
      setLoading(false);
    }
  }, []);

  // スキーマが変更されたらデータを再取得
  useEffect(() => {
    fetchData(schemaHistory.schema);
  }, [schemaHistory.schema, fetchData]);

  const refreshData = useCallback(async () => {
    await fetchData(schemaHistory.schema);
  }, [fetchData, schemaHistory.schema]);

  // スキーマ更新をラップしてデータ取得もトリガー
  const updateSchema = useCallback(
    (newSchema: LiquidViewSchema) => {
      schemaHistory.setSchema(newSchema);
      // useEffectでデータ取得がトリガーされる
    },
    [schemaHistory]
  );

  const value: DashboardContextType = {
    ...schemaHistory,
    setSchema: updateSchema,
    data,
    loading,
    error,
    refreshData,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
