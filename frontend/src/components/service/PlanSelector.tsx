import type { ServicePlan } from "../../types/service";

interface Props {
  plans: ServicePlan[];
  onSelect: (plan: ServicePlan) => void;
}

const cycleLabels: Record<string, string> = {
  monthly: "/월",
  yearly: "/년",
  weekly: "/주",
  quarterly: "/분기",
};

export default function PlanSelector({ plans, onSelect }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => {
        const price = new Intl.NumberFormat("ko-KR").format(plan.price);
        const unit = plan.currency === "KRW" ? "원" : "$";
        const isUsd = plan.currency === "USD";

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
                {cycleLabels[plan.billing_cycle]}
              </span>
            </p>
            {plan.description && (
              <p className="mt-1 text-xs text-slate-400">{plan.description}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
