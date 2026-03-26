import { useState } from "react";
import type { Category } from "../../types/category";
import type {
  BillingCycle,
  Subscription,
  SubscriptionCreateRequest,
  SubscriptionStatus,
} from "../../types/subscription";

interface Props {
  categories: Category[];
  initial?: Subscription | null;
  onSubmit: (data: SubscriptionCreateRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function SubscriptionForm({
  categories,
  initial,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  const [form, setForm] = useState({
    service_name: initial?.service_name ?? "",
    cost: initial?.cost?.toString() ?? "",
    currency: initial?.currency ?? "KRW",
    billing_cycle: (initial?.billing_cycle ?? "monthly") as BillingCycle,
    start_date: initial?.start_date ?? new Date().toISOString().split("T")[0],
    next_billing_date:
      initial?.next_billing_date ?? new Date().toISOString().split("T")[0],
    category_id: initial?.category_id ?? undefined,
    status: (initial?.status ?? "active") as SubscriptionStatus,
    auto_renew: initial?.auto_renew ?? true,
    notes: initial?.notes ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      cost: Number(form.cost),
      category_id: form.category_id || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-500">
          서비스 이름 *
        </label>
        <input
          type="text"
          value={form.service_name}
          onChange={(e) => setForm({ ...form, service_name: e.target.value })}
          required
          className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Netflix, YouTube Premium..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-500">
            비용 *
          </label>
          <input
            type="number"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            required
            min="0"
            step="100"
            className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="17000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500">
            결제 주기 *
          </label>
          <select
            value={form.billing_cycle}
            onChange={(e) =>
              setForm({
                ...form,
                billing_cycle: e.target.value as BillingCycle,
              })
            }
            className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="monthly">월간</option>
            <option value="yearly">연간</option>
            <option value="weekly">주간</option>
            <option value="quarterly">분기</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-500">
            시작일
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500">
            다음 결제일
          </label>
          <input
            type="date"
            value={form.next_billing_date}
            onChange={(e) =>
              setForm({ ...form, next_billing_date: e.target.value })
            }
            className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-500">
            카테고리
          </label>
          <select
            value={form.category_id ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                category_id: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">선택 안함</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500">
            상태
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as SubscriptionStatus,
              })
            }
            className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="active">활성</option>
            <option value="trial">체험판</option>
            <option value="paused">일시정지</option>
            <option value="cancelled">취소됨</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-500">메모</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="프리미엄 플랜, 가족 공유 등..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary-glass px-4 py-2 text-sm font-medium"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary-glass px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "저장 중..." : initial ? "수정" : "추가"}
        </button>
      </div>
    </form>
  );
}
