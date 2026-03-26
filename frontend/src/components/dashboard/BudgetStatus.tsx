import { Link } from "react-router-dom";
import type { BudgetStatus as BudgetStatusType } from "../../types/analytics";

interface Props {
  budgetStatus: BudgetStatusType;
}

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

function getProgressColor(percentage: number): string {
  if (percentage > 90) return "bg-red-500";
  if (percentage > 70) return "bg-amber-500";
  return "bg-emerald-500";
}

function getProgressBgColor(percentage: number): string {
  if (percentage > 90) return "bg-red-100";
  if (percentage > 70) return "bg-amber-100";
  return "bg-emerald-100";
}

export default function BudgetStatus({ budgetStatus }: Props) {
  const { budget_monthly, current_spending, remaining, percentage_used, is_over_budget } =
    budgetStatus;

  // No budget set
  if (budget_monthly === null) {
    return (
      <div className="glass p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-lg">
            💰
          </div>
          <h3 className="text-lg font-semibold text-slate-900">월 예산</h3>
        </div>
        <p className="text-sm text-slate-500">
          월 예산을 설정하면 지출을 관리할 수 있어요.
        </p>
        <Link
          to="/settings"
          className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          설정에서 예산 설정하기 →
        </Link>
      </div>
    );
  }

  const pct = percentage_used ?? 0;
  const barWidth = Math.min(pct, 100);
  const progressColor = getProgressColor(pct);
  const progressBgColor = getProgressBgColor(pct);

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-lg">
          💰
        </div>
        <h3 className="text-lg font-semibold text-slate-900">월 예산</h3>
        <span className="ml-auto text-sm font-medium text-slate-500">
          {fmt(current_spending)}원 / {fmt(budget_monthly)}원
        </span>
      </div>

      {/* Progress bar */}
      <div className={`h-3 w-full rounded-full ${progressBgColor}`}>
        <div
          className={`h-3 rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {pct.toFixed(1)}% 사용
        </span>
        {remaining !== null && !is_over_budget && (
          <span className="text-xs text-slate-500">
            잔여 {fmt(remaining)}원
          </span>
        )}
      </div>

      {/* Warnings */}
      {is_over_budget && remaining !== null && (
        <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          예산을 {fmt(Math.abs(remaining))}원 초과했습니다!
        </div>
      )}
      {!is_over_budget && pct > 80 && (
        <div className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-600">
          예산의 {pct.toFixed(1)}%를 사용했습니다
        </div>
      )}
    </div>
  );
}
