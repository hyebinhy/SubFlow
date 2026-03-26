import { format } from "date-fns";
import type { Subscription } from "../../types/subscription";

interface Props {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
  trial: "bg-blue-100 text-blue-700",
};

const statusLabels: Record<string, string> = {
  active: "활성",
  paused: "일시정지",
  cancelled: "취소됨",
  trial: "체험판",
};

const cycleLabels: Record<string, string> = {
  monthly: "월",
  yearly: "년",
  weekly: "주",
  quarterly: "분기",
};

export default function SubscriptionCard({ subscription, onEdit, onDelete }: Props) {
  const costDisplay = new Intl.NumberFormat("ko-KR").format(subscription.cost);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {subscription.service?.logo_url || subscription.logo_url ? (
            <img
              src={subscription.service?.logo_url ?? subscription.logo_url ?? ""}
              alt={subscription.service_name}
              className="h-10 w-10 rounded-lg object-contain"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
              style={{ backgroundColor: subscription.category?.color ?? "#E5E7EB" }}
            >
              {subscription.category?.icon ?? "💳"}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{subscription.service_name}</h3>
            <p className="text-xs text-gray-500">{subscription.category?.name ?? "미분류"}</p>
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[subscription.status]}`}>
          {statusLabels[subscription.status]}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {costDisplay}
            <span className="text-sm font-normal text-gray-500">
              {" "}{subscription.currency}/{cycleLabels[subscription.billing_cycle]}
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            다음 결제: {format(new Date(subscription.next_billing_date), "yyyy.MM.dd")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(subscription)}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            수정
          </button>
          <button
            onClick={() => onDelete(subscription.id)}
            className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
