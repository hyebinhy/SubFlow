import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryBreakdown } from "../../types/analytics";

interface Props {
  breakdown: CategoryBreakdown;
}

const COLORS = [
  "#6F7DF6",
  "#EE8C8C",
  "#5FCBA9",
  "#F3BE56",
  "#9B7AF4",
  "#E67DB6",
  "#55C4DC",
  "#EE9A62",
  "#7B88F5",
  "#6ACCC1",
];

export default function CategoryPieChart({ breakdown }: Props) {
  const data = breakdown.breakdown.map((item) => ({
    name: item.category,
    value: Number(item.total),
    percentage: item.percentage,
  }));

  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-400">데이터가 없습니다.</p>;
  }

  return (
    <div className="h-full min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Pie
            data={data}
            cx="50%"
            cy="46%"
            innerRadius="44%"
            outerRadius="68%"
            dataKey="value"
            paddingAngle={1}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${new Intl.NumberFormat("ko-KR").format(Number(value ?? 0))}원`, "지출"]}
            contentStyle={{
              background: "rgba(255,255,255,0.94)",
              border: "0",
              borderRadius: "14px",
              boxShadow: "0 12px 30px rgba(15,23,42,0.16)",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={42}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, lineHeight: "18px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
