import React from "react";
import type { StackLayout as StackLayoutType } from "@liqueur/protocol";

export interface StackLayoutComponentProps extends Omit<StackLayoutType, "type"> {
  children: React.ReactNode;
}

/**
 * StackLayout - スタックレイアウトコンポーネント
 */
export const StackLayout: React.FC<StackLayoutComponentProps> = ({
  direction = "vertical",
  gap = 0,
  children,
}) => {
  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: direction === "vertical" ? "column" : "row",
    gap: `${gap}px`,
  };

  return (
    <div
      data-testid="liquid-stack-layout"
      data-direction={direction}
      style={style}
      className="liquid-stack-layout"
    >
      {children}
    </div>
  );
};
