import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { CategoryBreakdown } from "../../types/analytics";

interface Props {
  breakdown: CategoryBreakdown;
}

const COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
];

export default function CategoryPieChart({ breakdown }: Props) {
  const data = breakdown.breakdown.map((item) => ({
    name: item.category,
    value: Number(item.total),
    percentage: item.percentage,
  }));

  if (data.length === 0) {
    return (
      <div className="glass p-6">
        <h3 className="mb-4 font-semibold text-slate-900">카테고리별 지출</h3>
        <p className="py-12 text-center text-slate-400">데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="glass p-6">
      <h3 className="mb-4 font-semibold text-slate-900">카테고리별 지출</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            label={({ percentage }) => `${percentage}%`}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              `${new Intl.NumberFormat("ko-KR").format(value)}원`,
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
