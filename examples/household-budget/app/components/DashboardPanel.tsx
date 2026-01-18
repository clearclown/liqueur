'use client';

import React from 'react';
import { LiquidRenderer } from '@liqueur/react';
import { useDashboard } from '../contexts/DashboardContext';
import { DashboardToolbar } from './DashboardToolbar';

/**
 * ダッシュボードパネル
 * ツールバーとLiquidRendererでスキーマをレンダリング
 */
export function DashboardPanel() {
  const { schema, data, loading, error } = useDashboard();

  return (
    <div className="dashboard-panel">
      <DashboardToolbar />
      
      {error && (
        <div className="error-message mb-4">
          <strong>エラー:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-gray-500">
              データを読み込み中...
            </div>
          </div>
        </div>
      ) : (
        <div className="card dashboard-content">
          <LiquidRenderer
            schema={schema}
            data={data}
            loading={false}
          />
        </div>
      )}

      {/* スキーマプレビュー（折りたたみ） */}
      <details className="card mt-4">
        <summary className="cursor-pointer font-medium text-gray-700 text-sm">
          現在のスキーマを表示
        </summary>
        <pre className="mt-4 p-4 bg-gray-100 rounded-md overflow-x-auto text-xs">
          {JSON.stringify(schema, null, 2)}
        </pre>
      </details>
    </div>
  );
}
