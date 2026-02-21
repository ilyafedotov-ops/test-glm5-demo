"use client";

import React from "react";
import { clsx } from "clsx";
import {
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import { Card, CardContent } from "@nexusops/ui";
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

// Types
export interface ChartDataPoint {
  [key: string]: string | number | null;
}

export interface ChartSeries {
  key: string;
  name: string;
  color?: string;
  type?: "line" | "area" | "bar";
  strokeWidth?: number;
  fillOpacity?: number;
}

export interface BaseChartProps {
  data: ChartDataPoint[];
  series: ChartSeries[];
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animated?: boolean;
  className?: string;
  loading?: boolean;
  onCrossFilter?: (key: string, value: string | number | null) => void;
  crossFilterValue?: { key: string; value: string | number } | null;
}

export interface LineAreaChartProps extends BaseChartProps {
  stacked?: boolean;
  showBrush?: boolean;
  referenceLines?: { value: number; label?: string; color?: string }[];
}

export interface BarChartProps extends BaseChartProps {
  layout?: "vertical" | "horizontal";
  stacked?: boolean;
  showValues?: boolean;
}

export interface PieChartProps extends BaseChartProps {
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  showPercentage?: boolean;
}

export interface RadarChartProps extends BaseChartProps {
  maxValue?: number;
}

// Default colors
const COLORS = [
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#F59E0B", // amber-500
  "#10B981", // emerald-500
  "#3B82F6", // blue-500
  "#F97316", // orange-500
  "#06B6D4", // cyan-500
  "#EF4444", // red-500
];

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  label,
  formatter,
}: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-3 shadow-xl">
      <p className="font-medium text-sm mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry["color"] }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {formatter ? formatter(entry["value"]) : entry["value"]?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom legend
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry["color"] }}
          />
          <span className="text-muted-foreground">{entry["value"]}</span>
        </div>
      ))}
    </div>
  );
};

// Loading skeleton
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div
    className="w-full rounded-xl bg-muted/50 shimmer"
    style={{ height }}
  />
);

// Line/Area Chart
export function TimeSeriesChart({
  data,
  series,
  xAxisKey = "date",
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  animated = true,
  className,
  loading,
  onCrossFilter,
  crossFilterValue: _crossFilterValue,
  stacked = false,
  showBrush = false,
  referenceLines = [],
}: LineAreaChartProps) {
  if (loading) return <ChartSkeleton height={height} />;

  return (
    <div className={clsx("relative", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          onClick={(e) => {
            if (e?.activeLabel && onCrossFilter) {
              onCrossFilter(xAxisKey, e.activeLabel);
            }
          }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          )}
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            stroke="rgba(255,255,255,0.3)"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="rgba(255,255,255,0.3)"
          />
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend content={<CustomLegend />} />}
          {showBrush && (
            <Brush
              dataKey={xAxisKey}
              height={30}
              stroke="#8B5CF6"
              fill="rgba(139, 92, 246, 0.1)"
            />
          )}
          {referenceLines.map((ref, i) => (
            <ReferenceLine
              key={i}
              y={ref.value}
              stroke={ref.color || "#EF4444"}
              strokeDasharray="5 5"
              label={ref.label}
            />
          ))}
          {series.map((s, index) => {
            const color = s.color || COLORS[index % COLORS.length];
            const type = s.type || "line";

            if (type === "area") {
              return (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={color}
                  fill={color}
                  fillOpacity={s.fillOpacity ?? 0.2}
                  strokeWidth={s.strokeWidth ?? 2}
                  stackId={stacked ? "stack" : undefined}
                  animationDuration={animated ? 500 : 0}
                />
              );
            }

            return (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={color}
                strokeWidth={s.strokeWidth ?? 2}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6, fill: color }}
                animationDuration={animated ? 500 : 0}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Bar Chart
export function BarChartComponent({
  data,
  series,
  xAxisKey = "name",
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  animated = true,
  className,
  loading,
  onCrossFilter,
  layout = "horizontal",
  stacked = false,
  showValues = false,
}: BarChartProps) {
  if (loading) return <ChartSkeleton height={height} />;

  const isVertical = layout === "vertical";

  return (
    <div className={clsx("relative", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={layout}
          onClick={(e) => {
            if (e?.activeLabel && onCrossFilter) {
              onCrossFilter(xAxisKey, e.activeLabel);
            }
          }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          )}
          {isVertical ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="rgba(255,255,255,0.3)" />
              <YAxis
                dataKey={xAxisKey}
                type="category"
                tick={{ fontSize: 12 }}
                stroke="rgba(255,255,255,0.3)"
                width={100}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xAxisKey}
                tick={{ fontSize: 12 }}
                stroke="rgba(255,255,255,0.3)"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="rgba(255,255,255,0.3)" />
            </>
          )}
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend content={<CustomLegend />} />}
          {series.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color || COLORS[index % COLORS.length]}
              stackId={stacked ? "stack" : undefined}
              animationDuration={animated ? 500 : 0}
              label={showValues ? { position: "top", fontSize: 10 } : undefined}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Pie/Donut Chart
export function PieChartComponent({
  data,
  series: _series,
  height = 300,
  showTooltip = true,
  animated = true,
  className,
  loading,
  innerRadius = 0,
  outerRadius = 100,
  showLabels = true,
  showPercentage = true,
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + ((item["value"] as number) || 0), 0);

  if (loading) return <ChartSkeleton height={height} />;

  return (
    <div className={clsx("relative", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            animationDuration={animated ? 500 : 0}
            label={
              showLabels
                ? ({ name, value }) =>
                    showPercentage
                      ? `${name}: ${(((value as number) / total) * 100).toFixed(1)}%`
                      : `${name}: ${value}`
                : false
            }
            labelLine={showLabels}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={(entry["color"] as string) || COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Radar Chart
export function RadarChartComponent({
  data,
  series,
  xAxisKey = "subject",
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  animated = true,
  className,
  loading,
  maxValue = 100,
}: RadarChartProps) {
  if (loading) return <ChartSkeleton height={height} />;

  return (
    <div className={clsx("relative", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data}>
          {showGrid && (
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
          )}
          <PolarAngleAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 11 }}
            stroke="rgba(255,255,255,0.3)"
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, maxValue]}
            tick={{ fontSize: 10 }}
            stroke="rgba(255,255,255,0.3)"
          />
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend content={<CustomLegend />} />}
          {series.map((s, index) => (
            <Radar
              key={s.key}
              name={s.name}
              dataKey={s.key}
              stroke={s.color || COLORS[index % COLORS.length]}
              fill={s.color || COLORS[index % COLORS.length]}
              fillOpacity={0.3}
              animationDuration={animated ? 500 : 0}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Stat Card with Trend
export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon: Icon,
  color = "violet",
  className,
  onClick,
}: StatCardProps) {
  const colorClasses: Record<string, { bg: string; gradient: string }> = {
    violet: { bg: "bg-violet-500/10", gradient: "from-violet-500 to-purple-500" },
    blue: { bg: "bg-blue-500/10", gradient: "from-blue-500 to-indigo-500" },
    emerald: { bg: "bg-emerald-500/10", gradient: "from-emerald-500 to-teal-500" },
    amber: { bg: "bg-amber-500/10", gradient: "from-amber-500 to-orange-500" },
    rose: { bg: "bg-rose-500/10", gradient: "from-rose-500 to-pink-500" },
  };

  const colorClass = colorClasses[color] || colorClasses["violet"];

  const TrendIcon = change
    ? change > 0
      ? TrendingUp
      : change < 0
      ? TrendingDown
      : Minus
    : null;

  return (
    <Card
      variant="glass"
      className={clsx(
        "group overflow-hidden",
        onClick && "cursor-pointer hover:shadow-lg transition-all",
        className
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity" 
           style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
      <CardContent className="relative pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1.5 mt-2">
                {TrendIcon && (
                  <TrendIcon
                    className={clsx(
                      "h-4 w-4",
                      change > 0 ? "text-emerald-500" : change < 0 ? "text-rose-500" : "text-muted-foreground"
                    )}
                  />
                )}
                <span
                  className={clsx(
                    "text-sm font-medium",
                    change > 0 ? "text-emerald-500" : change < 0 ? "text-rose-500" : "text-muted-foreground"
                  )}
                >
                  {change > 0 ? "+" : ""}
                  {change.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div
              className={clsx(
                "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg",
                `bg-gradient-to-br ${colorClass.gradient}`
              )}
              style={{ boxShadow: `0 10px 15px -3px rgba(var(--color-${color}), 0.25)` }}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Mini Sparkline Chart
export interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  showArea?: boolean;
  animated?: boolean;
}

export function Sparkline({
  data,
  color = "#8B5CF6",
  height = 40,
  width = 100,
  showArea = true,
  animated = true,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={chartData}>
        {showArea && (
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.2}
            strokeWidth={2}
            animationDuration={animated ? 300 : 0}
          />
        )}
        {!showArea && (
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            animationDuration={animated ? 300 : 0}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default {
  TimeSeriesChart,
  BarChartComponent,
  PieChartComponent,
  RadarChartComponent,
  StatCard,
  Sparkline,
};
