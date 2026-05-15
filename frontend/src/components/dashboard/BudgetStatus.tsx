import { Link } from "react-router-dom";
import { ArrowRight, WalletCards } from "lucide-react";
import type { BudgetStatus as BudgetStatusType } from "../../types/analytics";

interface Props {
  budgetStatus: BudgetStatusType;
}

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

function getProgressTone(percentage: number) {
  if (percentage > 90) {
    return {
      bar: "bg-rose-400",
      track: "bg-rose-100/70",
      text: "text-rose-600",
      chip: "bg-rose-100 text-rose-700",
    };
  }
  if (percentage > 70) {
    return {
      bar: "bg-amber-400",
      track: "bg-amber-100/70",
      text: "text-amber-600",
      chip: "bg-amber-100 text-amber-700",
    };
  }
  return {
    bar: "bg-emerald-400",
    track: "bg-emerald-100/70",
    text: "text-emerald-600",
    chip: "bg-emerald-100 text-emerald-700",
  };
}

export default function BudgetStatus({ budgetStatus }: Props) {
  const { budget_monthly, current_spending, remaining, percentage_used, is_over_budget } = budgetStatus;

  if (budget_monthly === null) {
    return (
      <div className="glass p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">월 예산</h3>
              <p className="text-sm text-slate-500">예산을 설정하면 지출 속도를 더 쉽게 볼 수 있어요.</p>
            </div>
          </div>
          <Link to="/settings" className="btn-primary-glass inline-flex shrink-0 items-center gap-1.5 px-4 py-2 text-sm">
            설정하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const pct = percentage_used ?? 0;
  const barWidth = Math.min(pct, 100);
  const tone = getProgressTone(pct);
  const statusText = is_over_budget
    ? `예산을 ${fmt(Math.abs(remaining ?? 0))}원 초과했어요.`
    : `이번 달 남은 예산은 ${fmt(remaining ?? 0)}원입니다.`;

  return (
    <Link to="/settings" className="glass block p-6">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">월 예산</h3>
              <p className="text-sm text-slate-500">현재 {fmt(current_spending)}원 / 기준 {fmt(budget_monthly)}원</p>
            </div>
          </div>

          <div className={`h-3 w-full rounded-full ${tone.track}`}>
            <div className={`h-3 rounded-full transition-all duration-500 ${tone.bar}`} style={{ width: `${barWidth}%` }} />
          </div>

          <p className={`mt-3 text-sm font-semibold ${tone.text}`}>{statusText}</p>
        </div>

        <div className="rounded-3xl bg-white/65 px-6 py-5 text-right shadow-sm">
          <p className="text-xs font-medium text-slate-400">예산 소진율</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{pct.toFixed(0)}%</p>
          <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone.chip}`}>
            {is_over_budget ? "조정 필요" : "관리 중"}
          </span>
        </div>
      </div>
    </Link>
  );
}
