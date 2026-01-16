import React from 'react';

export interface ComponentWrapperProps {
  /** Component type for testid and className */
  type: 'chart' | 'table';
  /** Component index */
  index: number;
  /** Optional title */
  title?: string;
  /** Loading state */
  loading?: boolean;
  /** Data availability */
  hasData: boolean;
  /** Component children to render when data is available */
  children: React.ReactNode;
}

/**
 * ComponentWrapper - 共通のローディング・空データ・タイトル表示ロジック
 * ChartComponentとTableComponentで重複していたコードを統合
 */
export const ComponentWrapper: React.FC<ComponentWrapperProps> = ({
  type,
  index,
  title,
  loading = false,
  hasData,
  children,
}) => {
  const testId = `liquid-component-${type}-${index}`;
  const className = `liquid-${type}-component`;

  // Base wrapper structure
  const wrapper = (content: React.ReactNode) => (
    <div data-testid={testId} className={className}>
      {title && <h3>{title}</h3>}
      {content}
    </div>
  );

  // FR-09: Loading state
  if (loading) {
    return wrapper(<div className={`${type}-loading`}>Loading...</div>);
  }

  // Empty data handling
  if (!hasData) {
    return wrapper(<div className={`${type}-no-data`}>No data available</div>);
  }

  // Render children when data is available
  return wrapper(children);
};
