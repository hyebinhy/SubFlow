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
    is_recurring: initial?.is_recurring ?? true,
    cancel_reminder: initial?.cancel_reminder ?? false,
    notes: initial?.notes ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      cost: Number(form.cost),
      category_id: form.category_id || undefined,
      is_recurring: form.is_recurring,
      cancel_reminder: form.cancel_reminder,
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

      {/* 결제 유형 */}
      <div>
        <label className="block text-sm font-medium text-slate-500 mb-2">
          결제 유형
        </label>
        <div className="glass-input inline-flex rounded-full p-1">
          <button
            type="button"
            onClick={() => setForm({ ...form, is_recurring: true, cancel_reminder: false })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              form.is_recurring
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            정기 결제
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, is_recurring: false })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              !form.is_recurring
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            일회성 결제
          </button>
        </div>

        {!form.is_recurring && (
          <div className="mt-3 glass rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                해지 알림이 필요하신가요?
              </span>
              <button
                type="button"
                onClick={() => setForm({ ...form, cancel_reminder: !form.cancel_reminder })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  form.cancel_reminder ? "bg-indigo-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    form.cancel_reminder ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {form.cancel_reminder && (
              <p className="text-xs text-indigo-500 bg-indigo-50/50 rounded-lg px-3 py-2">
                결제 3일 전, 1일 전, 당일에 알림을 보내드립니다
              </p>
            )}
          </div>
        )}
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
