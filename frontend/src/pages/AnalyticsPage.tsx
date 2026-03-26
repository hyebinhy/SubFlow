import { useAnalytics } from "../hooks/useAnalytics";
import CategoryPieChart from "../components/analytics/CategoryPieChart";
import MonthlySpendingChart from "../components/analytics/MonthlySpendingChart";
import SpendingTrendChart from "../components/analytics/SpendingTrendChart";
import SavingsSuggestions from "../components/dashboard/SavingsSuggestions";
import ExchangeRateAlert from "../components/dashboard/ExchangeRateAlert";

export default function AnalyticsPage() {
  const { overview, categoryBreakdown, spendingTrend, savingsSuggestions, exchangeRateAlerts, loading, error } = useAnalytics();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">지출 분석</h2>

      {overview ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass p-5">
            <p className="text-sm text-slate-400">월 평균 지출</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat("ko-KR").format(overview.total_monthly_cost)}원
            </p>
          </div>
          <div className="glass p-5">
            <p className="text-sm text-slate-400">연 예상 지출</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat("ko-KR").format(overview.total_yearly_cost)}원
            </p>
          </div>
          <div className="glass p-5">
            <p className="text-sm text-slate-400">가장 비싼 구독</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {overview.most_expensive?.service_name ?? "-"}
            </p>
            {overview.most_expensive && (
              <p className="text-sm text-slate-400">
                월 {new Intl.NumberFormat("ko-KR").format(overview.most_expensive.monthly_cost)}원
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center text-slate-400">분석 개요 데이터가 없습니다.</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {spendingTrend ? <SpendingTrendChart trend={spendingTrend} /> : (
          <p className="text-center text-slate-400">지출 추이 데이터가 없습니다.</p>
        )}
        {categoryBreakdown ? <CategoryPieChart breakdown={categoryBreakdown} /> : (
          <p className="text-center text-slate-400">카테고리별 지출 데이터가 없습니다.</p>
        )}
      </div>

      {spendingTrend ? <MonthlySpendingChart trend={spendingTrend} /> : null}

      {/* 환율 알림 */}
      {exchangeRateAlerts && exchangeRateAlerts.alerts.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">환율 변동 알림</h3>
          <ExchangeRateAlert alerts={exchangeRateAlerts.alerts} />
          {exchangeRateAlerts.current_usd_krw && (
            <p className="mt-2 text-xs text-slate-400">
              현재 환율: 1 USD = {new Intl.NumberFormat("ko-KR").format(exchangeRateAlerts.current_usd_krw)}원
            </p>
          )}
        </div>
      )}

      {/* 절약 제안 */}
      {savingsSuggestions && savingsSuggestions.suggestions.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">절약 제안</h3>
          <SavingsSuggestions
            suggestions={savingsSuggestions.suggestions}
            totalSavings={savingsSuggestions.total_potential_savings_krw}
          />
        </div>
      )}
    </div>
  );
}
