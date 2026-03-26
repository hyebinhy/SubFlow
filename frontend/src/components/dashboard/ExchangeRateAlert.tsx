import type { ExchangeRateAlertItem } from "../../types/analytics";

interface Props {
  alerts: ExchangeRateAlertItem[];
}

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export default function ExchangeRateAlert({ alerts }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="glass border border-red-200/60 bg-rose-50/30 p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-lg">
          💱
        </div>
        <h3 className="text-lg font-semibold text-red-900">
          환율 변동 알림
        </h3>
        <span className="ml-auto rounded-xl bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
          {alerts.length}건
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.subscription_id}
            className="flex items-center justify-between rounded-2xl bg-white/50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {alert.service_name}
                </p>
                <p className="text-xs text-slate-400">{alert.currency}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
                +{alert.change_percentage.toFixed(1)}%
              </span>
              <span className="text-sm font-semibold text-red-700">
                월 +{fmt(alert.extra_cost_krw)}원 추가 비용
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
