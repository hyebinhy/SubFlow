import { Timer } from "lucide-react";
import type { TrialSubscriptionItem } from "../../types/analytics";

interface Props {
  trials: TrialSubscriptionItem[];
}

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

function DdayBadge({ days }: { days: number }) {
  const label = days <= 0 ? "D-Day" : `D-${days}`;
  const colors =
    days <= 3
      ? "bg-rose-100/80 text-rose-600"
      : days <= 7
        ? "bg-amber-100/80 text-amber-600"
        : "bg-emerald-100/80 text-emerald-700";

  return <span className={`rounded-xl px-2.5 py-0.5 text-xs font-bold ${colors}`}>{label}</span>;
}

export default function TrialTracker({ trials }: Props) {
  if (trials.length === 0) return null;

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100/80 text-violet-600">
          <Timer className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">무료 체험 추적</h3>
        <span className="ml-auto rounded-xl bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {trials.length}건
        </span>
      </div>

      <div className="space-y-3">
        {trials.map((trial) => (
          <div key={trial.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 shadow-sm">
            <div className="flex min-w-0 items-center gap-3">
              {trial.logo_url ? (
                <img src={trial.logo_url} alt={trial.service_name} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                  <Timer className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{trial.service_name}</p>
                <p className="text-xs text-slate-400">
                  체험 종료 후 <span className="font-semibold text-slate-700">{fmt(trial.cost_after_trial_krw)}원</span>
                </p>
              </div>
            </div>

            <DdayBadge days={trial.days_remaining} />
          </div>
        ))}
      </div>
    </div>
  );
}
