import { format } from "date-fns";
import { CreditCard, TrendingDown, TrendingUp } from "lucide-react";
import type { PriceChangeAlertItem } from "../../types/analytics";

interface Props {
  alerts: PriceChangeAlertItem[];
}

export default function PriceChangeAlert({ alerts }: Props) {
  const fmt = (price: number | string, currency: string) => {
    const numericPrice = Number(price);
    const safePrice = Number.isFinite(numericPrice) ? numericPrice : 0;
    return currency === "KRW" ? `${new Intl.NumberFormat("ko-KR").format(safePrice)}원` : `$${safePrice.toFixed(2)}`;
  };

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100/80 text-rose-500">
          <TrendingUp className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">가격 변동 알림</h3>
        <span className="ml-auto rounded-xl bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {alerts.length}건
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const changeAmount = Number(alert.change_amount);
          const isUp = Number.isFinite(changeAmount) && changeAmount > 0;
          return (
            <div key={alert.subscription_id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 shadow-sm">
              <div className="flex min-w-0 items-center gap-3">
                {alert.logo_url ? (
                  <img src={alert.logo_url} alt={alert.service_name} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                    <CreditCard className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {alert.service_name}
                    <span className="ml-1 text-xs font-normal text-slate-400">{alert.plan_name}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {fmt(alert.old_price, alert.currency)}
                    {" -> "}
                    <span className="font-semibold text-slate-700">
                      {fmt(alert.new_price, alert.currency)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <div
                  className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold ${
                    isUp ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isUp ? "+" : ""}
                  {alert.change_percentage}%
                </div>
                <span className="text-[10px] text-slate-400">
                  {format(new Date(alert.effective_date), "yyyy.MM.dd")}부터
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
