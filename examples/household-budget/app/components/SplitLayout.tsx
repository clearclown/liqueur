'use client';

import React from 'react';

interface SplitLayoutProps {
  children: [React.ReactNode, React.ReactNode];
}

/**
 * 左右分割レイアウトコンポーネント
 * 左側70%: ダッシュボード
 * 右側30%: チャットパネル
 */
export function SplitLayout({ children }: SplitLayoutProps) {
  const [leftPanel, rightPanel] = children;

  return (
    <div className="split-layout">
      <div className="split-layout-left">
        {leftPanel}
      </div>
      <div className="split-layout-divider" />
      <div className="split-layout-right">
        {rightPanel}
      </div>
    </div>
  );
}
