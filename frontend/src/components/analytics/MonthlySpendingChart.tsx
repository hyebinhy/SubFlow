import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { SpendingTrend } from "../../types/analytics";

interface Props {
  trend: SpendingTrend;
}

export default function MonthlySpendingChart({ trend }: Props) {
  const data = trend.data.map((d) => ({
    name: `${d.month}월`,
    total: Number(d.total),
    isForecast: d.is_forecast ?? false,
  }));

  const fmt = (v: number) =>
    new Intl.NumberFormat("ko-KR", { notation: "compact" }).format(v);

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">월별 지출 추이</h3>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-500" />
            실제 지출
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-300/50 border border-dashed border-indigo-400" />
            예상 지출
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barCategoryGap="20%">
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
            formatter={(value: number, _name: string, props: { payload: { isForecast: boolean } }) => [
              `${new Intl.NumberFormat("ko-KR").format(value)}원`,
              props.payload.isForecast ? "예상 지출" : "지출",
            ]}
            contentStyle={{
              background: "rgba(255,255,255,0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.6)",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
          />
          <Bar dataKey="total" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.isForecast ? "rgba(129,140,248,0.3)" : "#6366F1"}
                stroke={entry.isForecast ? "#818CF8" : "none"}
                strokeWidth={entry.isForecast ? 1.5 : 0}
                strokeDasharray={entry.isForecast ? "4 3" : "none"}
              />
            ))}
          </Bar>
          {/* Forecast divider line */}
          {data.length > 1 && data[data.length - 1].isForecast && (
            <ReferenceLine
              x={data[data.length - 2].name}
              stroke="#CBD5E1"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
