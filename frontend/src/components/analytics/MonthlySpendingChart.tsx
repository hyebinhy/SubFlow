import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SpendingTrend } from "../../types/analytics";

interface Props {
  trend: SpendingTrend;
}

export default function MonthlySpendingChart({ trend }: Props) {
  const data = trend.data.map((d) => ({
    name: `${d.year}.${String(d.month).padStart(2, "0")}`,
    total: Number(d.total),
  }));

  return (
    <div className="glass p-6">
      <h3 className="mb-4 font-semibold text-slate-900">월별 지출 추이</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={12} />
          <YAxis
            fontSize={12}
            tickFormatter={(v) =>
              new Intl.NumberFormat("ko-KR", { notation: "compact" }).format(v)
            }
          />
          <Tooltip
            formatter={(value: number) => [
              `${new Intl.NumberFormat("ko-KR").format(value)}원`,
              "지출",
            ]}
          />
          <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
