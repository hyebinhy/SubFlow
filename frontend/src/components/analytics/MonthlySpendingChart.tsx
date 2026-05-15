import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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

  const fmt = (v: number) => new Intl.NumberFormat("ko-KR", { notation: "compact" }).format(v);

  return (
    <div className="h-full min-h-0">
      <div className="mb-3 flex items-center justify-end gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
          실제 지출
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-indigo-400 bg-indigo-300/50" />
          예상 지출
        </span>
      </div>
      <div className="h-[calc(100%-28px)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="24%" margin={{ top: 8, right: 4, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" vertical={false} />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "#94A3B8" }} />
            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94A3B8" }}
              tickFormatter={fmt}
            />
            <Tooltip
              formatter={(value, _name, props) => [
                `${new Intl.NumberFormat("ko-KR").format(Number(value ?? 0))}원`,
                props.payload?.isForecast ? "예상 지출" : "지출",
              ]}
              contentStyle={{
                background: "rgba(255,255,255,0.92)",
                border: "0",
                borderRadius: "14px",
                boxShadow: "0 12px 30px rgba(15,23,42,0.16)",
              }}
            />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isForecast ? "rgba(99,102,241,0.28)" : "#6366F1"}
                  stroke={entry.isForecast ? "#818CF8" : "none"}
                  strokeWidth={entry.isForecast ? 1.5 : 0}
                  strokeDasharray={entry.isForecast ? "4 3" : "none"}
                />
              ))}
            </Bar>
            {data.length > 1 && data[data.length - 1].isForecast && (
              <ReferenceLine x={data[data.length - 2].name} stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth={1} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
