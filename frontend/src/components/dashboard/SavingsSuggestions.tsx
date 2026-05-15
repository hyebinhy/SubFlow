import { Sparkles } from "lucide-react";
import type { SavingSuggestionItem } from "../../types/analytics";

interface Props {
  suggestions: SavingSuggestionItem[];
  totalSavings: number;
}

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export default function SavingsSuggestions({ suggestions, totalSavings }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600">
          <Sparkles className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">절약 제안</h3>
        <span className="ml-auto rounded-xl bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          월 최대 {fmt(totalSavings)}원
        </span>
      </div>

      <div className="space-y-3">
        {suggestions.map((item) => {
          const cheapest = item.cheaper_plans.reduce(
            (min, p) => (p.monthly_cost_krw < min.monthly_cost_krw ? p : min),
            item.cheaper_plans[0]
          );

          return (
            <div key={item.subscription_id} className="rounded-2xl bg-slate-50 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.service_name}
                    {item.current_plan_name && (
                      <span className="ml-1.5 text-xs font-normal text-slate-400">({item.current_plan_name})</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    현재 <span className="font-semibold text-slate-700">{fmt(item.current_monthly_krw)}원</span>
                    {" -> "}
                    {cheapest.plan_name}{" "}
                    <span className="font-semibold text-slate-700">{fmt(cheapest.monthly_cost_krw)}원</span>
                  </p>
                </div>

                <span className="shrink-0 rounded-xl bg-emerald-100/80 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  월 {fmt(item.max_savings_krw)}원 절약
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
