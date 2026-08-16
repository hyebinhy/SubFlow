import type { ServicePlan } from "../../types/service";
import { tr } from "../../i18n/translations";
import { krwHint, type RateTable } from "../../utils/currency";

interface Props {
  plans: ServicePlan[];
  onSelect: (plan: ServicePlan) => void;
  /** 원화 환산 보기. 외화 요금제 아래에 환산액을 덧붙인다. */
  showKrw?: boolean;
  rates?: RateTable;
}

// 언어 변경이 반영되도록 상수가 아니라 호출 시점에 만든다
const cycleLabels = (): Record<string, string> => ({
  monthly: tr("/월"),
  yearly: tr("/년"),
  weekly: tr("/주"),
  quarterly: tr("/분기"),
});

export default function PlanSelector({ plans, onSelect, showKrw, rates }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => {
        const price = new Intl.NumberFormat("ko-KR").format(plan.price);
        const unit = plan.currency === "KRW" ? tr("원") : "$";
        const isUsd = plan.currency === "USD";
        const krw =
          showKrw && rates
            ? krwHint(plan.price, plan.currency, rates[plan.currency?.toUpperCase()])
            : null;

        return (
          <button
            key={plan.id}
            onClick={() => onSelect(plan)}
            className="glass border-2 border-white/60 p-4 text-left transition-all hover:border-blue-500/60 hover:bg-blue-500/10"
          >
            <p className="font-semibold text-slate-900">{plan.name}</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {isUsd && "$"}
              {price}
              {!isUsd && unit}
              <span className="text-sm font-normal text-slate-400">
                {cycleLabels()[plan.billing_cycle]}
              </span>
            </p>
            {krw && <p className="mt-0.5 text-sm text-slate-500">{krw}</p>}
            {plan.description && (
              <p className="mt-1 text-xs text-slate-400">{plan.description}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
