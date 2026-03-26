import { useAnalytics } from "../hooks/useAnalytics";
import CategoryPieChart from "../components/analytics/CategoryPieChart";
import MonthlySpendingChart from "../components/analytics/MonthlySpendingChart";
import SpendingTrendChart from "../components/analytics/SpendingTrendChart";

export default function AnalyticsPage() {
  const { overview, categoryBreakdown, spendingTrend, loading } = useAnalytics();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">지출 분석</h2>

      {overview && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">월 평균 지출</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat("ko-KR").format(overview.total_monthly_cost)}원
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">연 예상 지출</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat("ko-KR").format(overview.total_yearly_cost)}원
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">가장 비싼 구독</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {overview.most_expensive?.service_name ?? "-"}
            </p>
            {overview.most_expensive && (
              <p className="text-sm text-gray-500">
                월 {new Intl.NumberFormat("ko-KR").format(overview.most_expensive.monthly_cost)}원
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {spendingTrend && <SpendingTrendChart trend={spendingTrend} />}
        {categoryBreakdown && <CategoryPieChart breakdown={categoryBreakdown} />}
      </div>

      {spendingTrend && <MonthlySpendingChart trend={spendingTrend} />}
    </div>
  );
}
