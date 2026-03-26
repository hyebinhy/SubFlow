import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import type { SpendingTrend } from "../../types/analytics";

interface Props {
  trend: SpendingTrend;
}

export default function SpendingTrendChart({ trend }: Props) {
  // Split into actual and forecast
  const actualData = trend.data.filter((d) => !d.is_forecast);
  const forecastData = trend.data.filter((d) => d.is_forecast);

  // Combine: actual line solid, forecast line dashed
  const allData = trend.data.map((d) => ({
    name: `${d.month}월`,
    actual: d.is_forecast ? undefined : Number(d.total),
    forecast: d.is_forecast ? Number(d.total) : undefined,
    // Bridge: last actual point also in forecast for connected line
    total: Number(d.total),
    isForecast: d.is_forecast ?? false,
  }));

  // Add bridge: copy last actual value into forecast field so lines connect
  if (actualData.length > 0 && forecastData.length > 0) {
    const lastActualIdx = allData.findIndex((d) => d.isForecast) - 1;
    if (lastActualIdx >= 0) {
      allData[lastActualIdx].forecast = allData[lastActualIdx].actual;
    }
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat("ko-KR", { notation: "compact" }).format(v);

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">지출 추이</h3>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 bg-indigo-500 rounded" />
            실제
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 border-t border-dashed border-indigo-400" />
            예상
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={allData}>
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818CF8" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#818CF8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="name"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94A3B8" }}
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94A3B8" }}
            tickFormatter={fmt}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${new Intl.NumberFormat("ko-KR").format(value)}원`,
              name === "forecast" ? "예상 지출" : "지출",
            ]}
            contentStyle={{
              background: "rgba(255,255,255,0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.6)",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#6366F1"
            strokeWidth={2.5}
            fill="url(#actualGrad)"
            dot={{ r: 4, fill: "#6366F1", strokeWidth: 2, stroke: "#fff" }}
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="forecast"
            stroke="#818CF8"
            strokeWidth={2}
            strokeDasharray="6 4"
            fill="url(#forecastGrad)"
            dot={{ r: 4, fill: "#fff", strokeWidth: 2, stroke: "#818CF8" }}
            connectNulls={false}
          />
          {forecastData.length > 0 && (
            <ReferenceDot
              x={`${forecastData[0].month}월`}
              y={Number(forecastData[0].total)}
              r={0}
              label={{
                value: "예상",
                position: "top",
                fill: "#818CF8",
                fontSize: 11,
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
