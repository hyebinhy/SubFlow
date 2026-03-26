import { useAnalytics } from "../hooks/useAnalytics";
import { useSubscriptions } from "../hooks/useSubscriptions";
import SummaryCards from "../components/analytics/SummaryCards";
import MonthlySpendingChart from "../components/analytics/MonthlySpendingChart";
import CategoryPieChart from "../components/analytics/CategoryPieChart";
import { format } from "date-fns";

export default function DashboardPage() {
  const { overview, categoryBreakdown, spendingTrend, loading } = useAnalytics();
  const { subscriptions } = useSubscriptions();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const upcoming = subscriptions
    .filter((s) => s.status === "active")
    .sort((a, b) => a.next_billing_date.localeCompare(b.next_billing_date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">대시보드</h2>

      {overview && <SummaryCards overview={overview} />}

      <div className="grid gap-6 lg:grid-cols-2">
        {spendingTrend && <MonthlySpendingChart trend={spendingTrend} />}
        {categoryBreakdown && <CategoryPieChart breakdown={categoryBreakdown} />}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-gray-900">다가오는 결제</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">예정된 결제가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{sub.category?.icon ?? "💳"}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {sub.service_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(sub.next_billing_date), "yyyy.MM.dd")}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">
                  {new Intl.NumberFormat("ko-KR").format(sub.cost)}원
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
