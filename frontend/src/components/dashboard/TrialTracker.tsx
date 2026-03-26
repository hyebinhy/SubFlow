import type { TrialSubscriptionItem } from "../../types/analytics";

interface Props {
  trials: TrialSubscriptionItem[];
}

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

function DdayBadge({ days }: { days: number }) {
  const label = days <= 0 ? "D-Day" : `D-${days}`;

  let colors: string;
  if (days <= 3) {
    colors = "bg-red-100 text-red-700";
  } else if (days <= 7) {
    colors = "bg-amber-100 text-amber-700";
  } else {
    colors = "bg-emerald-100 text-emerald-700";
  }

  return (
    <span
      className={`rounded-xl px-2.5 py-0.5 text-xs font-bold ${colors}`}
    >
      {label}
    </span>
  );
}

export default function TrialTracker({ trials }: Props) {
  if (trials.length === 0) return null;

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-lg">
          ⏳
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          무료 체험 추적
        </h3>
        <span className="ml-auto rounded-xl bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
          {trials.length}건
        </span>
      </div>

      <div className="space-y-2">
        {trials.map((trial) => (
          <div
            key={trial.id}
            className="flex items-center justify-between rounded-2xl px-4 py-3 transition-colors hover:bg-white/40"
          >
            <div className="flex items-center gap-3">
              {trial.logo_url ? (
                <img
                  src={trial.logo_url}
                  alt={trial.service_name}
                  className="h-11 w-11 rounded-[14px] object-cover shadow-md"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-violet-400 to-purple-500 shadow-md">
                  <span className="text-lg text-white">🎁</span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {trial.service_name}
                </p>
                <p className="text-xs text-slate-400">
                  체험 종료 후{" "}
                  <span className="font-semibold text-slate-600">
                    {fmt(trial.cost_after_trial_krw)}원/월
                  </span>
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
