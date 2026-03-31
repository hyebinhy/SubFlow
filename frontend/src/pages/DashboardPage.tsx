import { useAnalytics } from "../hooks/useAnalytics";
import { useSubscriptions } from "../hooks/useSubscriptions";
import MonthlySpendingChart from "../components/analytics/MonthlySpendingChart";
import CategoryPieChart from "../components/analytics/CategoryPieChart";
import BudgetStatus from "../components/dashboard/BudgetStatus";
import TrialTracker from "../components/dashboard/TrialTracker";
import OverlapWarning from "../components/dashboard/OverlapWarning";
import ExchangeRateAlert from "../components/dashboard/ExchangeRateAlert";
import PriceChangeAlert from "../components/dashboard/PriceChangeAlert";
import SavingsSuggestions from "../components/dashboard/SavingsSuggestions";
import { format } from "date-fns";

export default function DashboardPage() {
  const {
    overview,
    categoryBreakdown,
    spendingTrend,
    overlaps,
    exchangeRateAlerts,
    trials,
    savingsSuggestions,
    priceChanges,
    budgetStatus,
    loading,
    error: analyticsError,
  } = useAnalytics();
  const { subscriptions, error: subscriptionsError } = useSubscriptions();

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (analyticsError || subscriptionsError) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
        {analyticsError || subscriptionsError}
      </div>
    );
  }

  const upcoming = subscriptions
    .filter((s) => s.status === "active")
    .sort((a, b) => a.next_billing_date.localeCompare(b.next_billing_date))
    .slice(0, 5);

  const upcomingCount = subscriptions.filter(
    (s) =>
      s.status === "active" &&
      new Date(s.next_billing_date).getTime() - Date.now() <=
        7 * 24 * 60 * 60 * 1000
  ).length;

  const savingsEstimate = savingsSuggestions?.total_potential_savings_krw ?? 0;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">대시보드</h2>
        <p className="mt-1 text-sm text-slate-400">
          {format(new Date(), "yyyy년 MM월 dd일")} 기준
        </p>
      </div>

      {/* Summary cards */}
      {overview && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* 월 총 지출 */}
          <div className="glass p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">월 총 지출</p>
                <p className="mt-2 text-2xl font-extrabold gradient-text">
                  {fmt(overview.total_monthly_cost)}원
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
                💰
              </div>
            </div>
          </div>

          {/* 활성 구독 */}
          <div className="glass p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">활성 구독</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {overview.total_active_subscriptions}개
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                📦
              </div>
            </div>
          </div>

          {/* 다가오는 결제 */}
          <div className="glass p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">다가오는 결제</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {upcomingCount}건
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
                🔔
              </div>
            </div>
          </div>

          {/* 절약 금액 */}
          <div className="glass p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">절약 금액</p>
                <p className="mt-2 text-2xl font-extrabold text-emerald-500">
                  {fmt(savingsEstimate)}원
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                📉
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget status */}
      {budgetStatus && <BudgetStatus budgetStatus={budgetStatus} />}

      {/* Smart subscription alerts */}
      {trials && trials.trials.length > 0 && (
        <TrialTracker trials={trials.trials} />
      )}
      {overlaps && overlaps.overlaps.length > 0 && (
        <OverlapWarning overlaps={overlaps.overlaps} />
      )}
      {priceChanges && priceChanges.alerts.length > 0 && (
        <PriceChangeAlert alerts={priceChanges.alerts} />
      )}
      {exchangeRateAlerts && exchangeRateAlerts.alerts.length > 0 && (
        <ExchangeRateAlert alerts={exchangeRateAlerts.alerts} />
      )}

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {spendingTrend && (
          <MonthlySpendingChart trend={spendingTrend} />
        )}
        {categoryBreakdown && (
          <CategoryPieChart breakdown={categoryBreakdown} />
        )}
      </div>

      {/* Savings suggestions */}
      {savingsSuggestions && savingsSuggestions.suggestions.length > 0 && (
        <SavingsSuggestions
          suggestions={savingsSuggestions.suggestions}
          totalSavings={savingsSuggestions.total_potential_savings_krw}
        />
      )}

      {/* Upcoming payments */}
      <div className="glass p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          다가오는 결제
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400">예정된 결제가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((sub) => {
              const daysLeft = Math.ceil(
                (new Date(sub.next_billing_date).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              );
              const isUrgent = daysLeft <= 3;
              const isSoon = daysLeft <= 7 && !isUrgent;

              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 transition-colors hover:bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    {sub.logo_url ? (
                      <img
                        src={sub.logo_url}
                        alt={sub.service_name}
                        className="h-11 w-11 rounded-[14px] object-cover shadow-md"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-blue-400 to-indigo-500 shadow-md">
                        <span className="text-lg text-white">
                          {sub.category?.icon ?? "💳"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {sub.service_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {format(
                          new Date(sub.next_billing_date),
                          "yyyy.MM.dd"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isUrgent && (
                      <span className="rounded-xl bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                        {daysLeft}일 후
                      </span>
                    )}
                    {isSoon && (
                      <span className="rounded-xl bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                        {daysLeft}일 후
                      </span>
                    )}
                    {!isUrgent && !isSoon && (
                      <span className="rounded-xl bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        {daysLeft}일 후
                      </span>
                    )}
                    <p className="text-sm font-semibold text-slate-900">
                      {sub.currency === "KRW"
                        ? `${fmt(sub.cost)}원`
                        : new Intl.NumberFormat("en-US", { style: "currency", currency: sub.currency }).format(sub.cost)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
