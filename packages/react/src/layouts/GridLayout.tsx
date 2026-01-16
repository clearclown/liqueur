import React from "react";
import type { GridLayout as GridLayoutType } from "@liqueur/protocol";

export interface GridLayoutComponentProps extends Omit<GridLayoutType, "type"> {
  children: React.ReactNode;
}

/**
 * GridLayout - グリッドレイアウトコンポーネント
 */
export const GridLayout: React.FC<GridLayoutComponentProps> = ({ columns, gap = 0, children }) => {
  const style: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`,
  };

  return (
    <div
      data-testid="liquid-grid-layout"
      data-columns={columns}
      style={style}
      className="liquid-grid-layout"
    >
      {children}
    </div>
  );
};
