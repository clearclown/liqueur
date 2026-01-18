'use client';

import { useState, useCallback, useMemo } from 'react';
import type { LiquidViewSchema } from '@liqueur/protocol';

const MAX_HISTORY_SIZE = 20;

interface SchemaHistoryState {
  past: LiquidViewSchema[];
  present: LiquidViewSchema;
  future: LiquidViewSchema[];
}

export interface SchemaHistoryReturn {
  /** 現在のスキーマ */
  schema: LiquidViewSchema;
  /** スキーマを更新（履歴に追加） */
  setSchema: (newSchema: LiquidViewSchema) => void;
  /** 一つ前の状態に戻す */
  undo: () => void;
  /** 一つ先の状態に進む */
  redo: () => void;
  /** 初期状態にリセット */
  reset: () => void;
  /** Undoが可能か */
  canUndo: boolean;
  /** Redoが可能か */
  canRedo: boolean;
  /** 履歴の長さ（past + future） */
  historyLength: number;
}

/**
 * スキーマの履歴管理フック
 * Undo/Redo/Reset機能を提供
 */
export function useSchemaHistory(initialSchema: LiquidViewSchema): SchemaHistoryReturn {
  const [state, setState] = useState<SchemaHistoryState>({
    past: [],
    present: initialSchema,
    future: [],
  });

  const setSchema = useCallback((newSchema: LiquidViewSchema) => {
    setState((prevState) => {
      // 新しいpast配列を作成（最大サイズを超えないように）
      const newPast = [...prevState.past, prevState.present];
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: newSchema,
        future: [], // 新しい変更があったらfutureはクリア
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prevState) => {
      if (prevState.past.length === 0) return prevState;

      const newPast = [...prevState.past];
      const previous = newPast.pop()!;

      return {
        past: newPast,
        present: previous,
        future: [prevState.present, ...prevState.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prevState) => {
      if (prevState.future.length === 0) return prevState;

      const newFuture = [...prevState.future];
      const next = newFuture.shift()!;

      return {
        past: [...prevState.past, prevState.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      past: [],
      present: initialSchema,
      future: [],
    });
  }, [initialSchema]);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;
  const historyLength = state.past.length + state.future.length;

  return useMemo(
    () => ({
      schema: state.present,
      setSchema,
      undo,
      redo,
      reset,
      canUndo,
      canRedo,
      historyLength,
    }),
    [state.present, setSchema, undo, redo, reset, canUndo, canRedo, historyLength]
  );
}
