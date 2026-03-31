import { format } from "date-fns";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { PriceChangeAlertItem } from "../../types/analytics";

interface Props {
  alerts: PriceChangeAlertItem[];
}

export default function PriceChangeAlert({ alerts }: Props) {
  const fmt = (price: number, currency: string) =>
    currency === "KRW"
      ? `${new Intl.NumberFormat("ko-KR").format(price)}원`
      : `$${price.toFixed(2)}`;

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-lg">
          <TrendingUp className="h-4 w-4 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">가격 변동 알림</h3>
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
          {alerts.length}건
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const isUp = alert.change_amount > 0;
          return (
            <div
              key={alert.subscription_id}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                isUp ? "bg-red-50/50" : "bg-blue-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                {alert.logo_url ? (
                  <img
                    src={alert.logo_url}
                    alt={alert.service_name}
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-lg">
                    💳
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {alert.service_name}
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      {alert.plan_name}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {fmt(alert.old_price, alert.currency)}
                    {" → "}
                    <span
                      className={`font-semibold ${isUp ? "text-red-500" : "text-blue-500"}`}
                    >
                      {fmt(alert.new_price, alert.currency)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div
                  className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold ${
                    isUp
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {isUp ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
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
