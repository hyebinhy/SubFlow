import { DollarSign } from "lucide-react";
import type { ExchangeRateAlertItem } from "../../types/analytics";
import { tr, fmtMoney, fmtCount } from "../../i18n/translations";

interface Props {
  alerts: ExchangeRateAlertItem[];
}


export default function ExchangeRateAlert({ alerts }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="glass bg-rose-50/40 p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100/80 text-rose-500">
          <DollarSign className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{tr("환율 변동 알림")}</h3>
        <span className="ml-auto rounded-xl bg-rose-100/80 px-2.5 py-0.5 text-xs font-medium text-rose-600">
          {fmtCount(alerts.length, "건")}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.subscription_id} className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-900">{alert.service_name}</p>
              <p className="text-xs text-slate-400">{alert.currency}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-rose-100/80 px-2.5 py-0.5 text-xs font-bold text-rose-600">
                +{alert.change_percentage.toFixed(1)}%
              </span>
              <span className="text-sm font-semibold text-rose-600">{tr("월 +{a}", { a: fmtMoney(alert.extra_cost_krw) })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
