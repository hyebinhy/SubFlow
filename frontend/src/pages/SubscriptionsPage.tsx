import { useState } from "react";
import toast from "react-hot-toast";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { subscriptionApi } from "../api/subscriptions";
import SubscriptionCard from "../components/subscription/SubscriptionCard";
import SubscriptionForm from "../components/subscription/SubscriptionForm";
import SubscriptionModal from "../components/subscription/SubscriptionModal";
import type {
  Subscription,
  SubscriptionCreateRequest,
} from "../types/subscription";

export default function SubscriptionsPage() {
  const { subscriptions, categories, loading, refetch } = useSubscriptions();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreate = async (data: SubscriptionCreateRequest) => {
    setSaving(true);
    try {
      await subscriptionApi.create(data);
      toast.success("구독이 추가되었습니다.");
      setModalOpen(false);
      refetch();
    } catch {
      toast.error("구독 추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: SubscriptionCreateRequest) => {
    if (!editing) return;
    setSaving(true);
    try {
      await subscriptionApi.update(editing.id, data);
      toast.success("구독이 수정되었습니다.");
      setEditing(null);
      refetch();
    } catch {
      toast.error("구독 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("이 구독을 삭제하시겠습니까?")) return;
    try {
      await subscriptionApi.delete(id);
      toast.success("구독이 삭제되었습니다.");
      refetch();
    } catch {
      toast.error("구독 삭제에 실패했습니다.");
    }
  };

  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const totalMonthly = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      const cost = Number(s.cost);
      switch (s.billing_cycle) {
        case "weekly": return sum + cost * 4.33;
        case "monthly": return sum + cost;
        case "quarterly": return sum + cost / 3;
        case "yearly": return sum + cost / 12;
        default: return sum + cost;
      }
    }, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">구독 관리</h2>
          <p className="mt-1 text-sm text-gray-500">
            활성 {activeCount}개 · 월 예상 비용{" "}
            {new Intl.NumberFormat("ko-KR").format(Math.round(totalMonthly))}원
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 구독 추가
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 py-12 text-center">
          <p className="text-gray-500">아직 등록된 구독이 없습니다.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            첫 번째 구독 추가하기
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <SubscriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="구독 추가"
      >
        <SubscriptionForm
          categories={categories}
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </SubscriptionModal>

      <SubscriptionModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="구독 수정"
      >
        <SubscriptionForm
          categories={categories}
          initial={editing}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
          loading={saving}
        />
      </SubscriptionModal>
    </div>
  );
}
