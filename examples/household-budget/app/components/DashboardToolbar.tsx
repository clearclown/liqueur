'use client';

import React from 'react';
import { useDashboard } from '../contexts/DashboardContext';

/**
 * ダッシュボードツールバー
 * Undo/Redo/Reset機能とステータス表示
 */
export function DashboardToolbar() {
  const { undo, redo, reset, canUndo, canRedo, historyLength, refreshData, loading } = useDashboard();

  return (
    <div className="dashboard-toolbar">
      <div className="toolbar-left">
        <h2 className="text-lg font-semibold text-gray-800">ダッシュボード</h2>
        {historyLength > 0 && (
          <span className="text-sm text-gray-500 ml-2">
            (編集履歴: {historyLength})
          </span>
        )}
      </div>
      
      <div className="toolbar-right">
        <button
          onClick={refreshData}
          disabled={loading}
          className="toolbar-btn"
          title="データを再取得"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        <button
          onClick={undo}
          disabled={!canUndo || loading}
          className="toolbar-btn"
          title="元に戻す (Undo)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        <button
          onClick={redo}
          disabled={!canRedo || loading}
          className="toolbar-btn"
          title="やり直す (Redo)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        <button
          onClick={reset}
          disabled={historyLength === 0 || loading}
          className="toolbar-btn toolbar-btn-danger"
          title="初期状態に戻す (Reset)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
