import React from "react";
import type { LiquidViewSchema } from "@liqueur/protocol";
import { GridLayout } from "../layouts/GridLayout";
import { StackLayout } from "../layouts/StackLayout";
import { ChartComponent } from "./ChartComponent";
import { TableComponent } from "./TableComponent";

export interface LiquidRendererProps {
  schema: LiquidViewSchema;
  loading?: boolean;
  data?: Record<string, unknown[]>;
}

const SUPPORTED_VERSIONS = ["1.0"];

/**
 * LiquidRenderer - JSON SchemaをReactコンポーネントに変換
 * FR-08: UIレンダリング
 * FR-09: ローディング状態管理
 */
export const LiquidRenderer: React.FC<LiquidRendererProps> = ({
  schema,
  loading = false,
  data = {},
}) => {
  // バージョン検証
  if (!SUPPORTED_VERSIONS.includes(schema.version)) {
    throw new Error(`Unsupported protocol version: ${schema.version}`);
  }

  // データソース参照検証
  validateDataSourceReferences(schema);

  // FR-09: ローディング状態
  if (loading) {
    return (
      <div data-testid="liquid-loading-indicator" className="liquid-loading">
        <p>Loading...</p>
      </div>
    );
  }

  // レイアウトに応じたコンポーネントレンダリング
  const renderComponent = (component: (typeof schema.components)[number], index: number) => {
    const componentData = component.data_source ? data[component.data_source] : undefined;

    switch (component.type) {
      case "chart":
        return <ChartComponent key={index} {...component} data={componentData} index={index} />;
      case "table":
        return <TableComponent key={index} {...component} data={componentData} index={index} />;
      default:
        return null;
    }
  };

  // レイアウトレンダリング
  switch (schema.layout.type) {
    case "grid":
      return (
        <GridLayout {...schema.layout}>
          {schema.components.map((component, index) => renderComponent(component, index))}
        </GridLayout>
      );
    case "stack":
      return (
        <StackLayout {...schema.layout}>
          {schema.components.map((component, index) => renderComponent(component, index))}
        </StackLayout>
      );
    default:
      throw new Error(`Unsupported layout type: ${(schema.layout as any).type}`);
  }
};

/**
 * データソース参照の整合性を検証
 * 存在しないdata_sourceを参照している場合はエラー
 */
function validateDataSourceReferences(schema: LiquidViewSchema): void {
  for (const component of schema.components) {
    if (component.data_source && !schema.data_sources[component.data_source]) {
      throw new Error(`Data source "${component.data_source}" not found`);
    }
  }
}
