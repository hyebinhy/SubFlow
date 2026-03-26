import type { DashboardOverview } from "../../types/analytics";
import { format } from "date-fns";

interface Props {
  overview: DashboardOverview;
}

export default function SummaryCards({ overview }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  const cards = [
    {
      label: "활성 구독",
      value: `${overview.total_active_subscriptions}개`,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "월 예상 비용",
      value: `${fmt(overview.total_monthly_cost)}원`,
      color: "bg-green-50 text-green-700",
    },
    {
      label: "연 예상 비용",
      value: `${fmt(overview.total_yearly_cost)}원`,
      color: "bg-purple-50 text-purple-700",
    },
    {
      label: "다음 결제",
      value: overview.next_renewal
        ? `${overview.next_renewal.service_name} (${format(new Date(overview.next_renewal.next_billing_date), "MM.dd")})`
        : "없음",
      color: "bg-orange-50 text-orange-700",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl p-5 ${card.color}`}
        >
          <p className="text-sm font-medium opacity-80">{card.label}</p>
          <p className="mt-1 text-xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
