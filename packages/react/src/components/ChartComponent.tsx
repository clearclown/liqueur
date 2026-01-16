import React from "react";
import type { ChartComponent as ChartComponentType } from "@liqueur/protocol";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ComponentWrapper } from "./ComponentWrapper";

export interface ChartComponentProps extends ChartComponentType {
  data?: unknown[];
  index: number;
  loading?: boolean;
  width?: number;
  height?: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

/**
 * ChartComponent - チャート表示コンポーネント（FR-08, FR-09）
 *
 * recharts統合による実装
 * Bar/Line/Pieチャートをサポート
 */
export const ChartComponent: React.FC<ChartComponentProps> = ({
  variant,
  title,
  data,
  index,
  loading = false,
  width,
  height = 400,
}) => {
  const chartData = (data || []) as Array<Record<string, unknown>>;
  const hasData = chartData.length > 0;

  // データから最初のキーを取得（XAxis/PieChart用）
  const firstDataPoint = hasData ? chartData[0] : {};
  const keys = Object.keys(firstDataPoint);
  const xKey = keys[0]; // 最初のキー（name, date, categoryなど）
  const yKeys = keys.slice(1); // 残りのキー（value, amount など）

  const renderChart = () => {
    switch (variant) {
      case "bar":
        return (
          <ResponsiveContainer width={width || "100%"} height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {yKeys.map((key, idx) => (
                <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width={width || "100%"} height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {yKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[idx % COLORS.length]}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie": {
        // Pieチャートは最初のyKeyのみ使用
        const pieDataKey = yKeys[0];
        return (
          <ResponsiveContainer width={width || "100%"} height={height}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={pieDataKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {chartData.map((_entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      default:
        return <div className="chart-unsupported">Unsupported chart variant: {variant}</div>;
    }
  };

  return (
    <ComponentWrapper type="chart" index={index} title={title} loading={loading} hasData={hasData}>
      {renderChart()}
    </ComponentWrapper>
  );
};
