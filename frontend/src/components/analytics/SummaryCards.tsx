import { format } from "date-fns";
import type { DashboardOverview } from "../../types/analytics";
import { tr, fmtMoney, fmtCount } from "../../i18n/translations";

interface Props {
  overview: DashboardOverview;
}

export default function SummaryCards({ overview }: Props) {

  const cards = [
    {
      label: tr("활성 구독"),
      value: fmtCount(overview.total_active_subscriptions, "개"),
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      label: tr("월 예상 비용"),
      value: fmtMoney(overview.total_monthly_cost),
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: tr("연 예상 비용"),
      value: fmtMoney(overview.total_yearly_cost),
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      label: tr("다음 결제"),
      value: overview.next_renewal
        ? `${overview.next_renewal.service_name} (${format(new Date(overview.next_renewal.next_billing_date), "MM.dd")})`
        : tr("없음"),
      color: "bg-orange-500/10 text-orange-500",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className={`glass p-5 ${card.color}`}>
          <p className="text-sm font-medium opacity-80">{card.label}</p>
          <p className="mt-1 text-xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
