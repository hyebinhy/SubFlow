import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { serviceApi } from "../api/services";
import { subscriptionApi } from "../api/subscriptions";
import { categoryApi } from "../api/categories";
import type { ServiceListItem, ServicePlan } from "../types/service";
import type { Category } from "../types/category";
import ServiceCard from "../components/service/ServiceCard";
import ServiceDetail from "../components/service/ServiceDetail";
import SubscriptionModal from "../components/subscription/SubscriptionModal";

export default function ServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [subscribing, setSubscribing] = useState<{
    serviceId: number;
    plan: ServicePlan;
  } | null>(null);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [nextDate, setNextDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const [svcs, cats] = await Promise.all([
        search
          ? serviceApi.search(search)
          : serviceApi.getAll(selectedCategory),
        categoryApi.getAll(),
      ]);
      setServices(svcs);
      setCategories(cats);
    } catch {
      toast.error("서비스 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(fetchServices, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchServices, search]);

  const handleSubscribe = async () => {
    if (!subscribing) return;
    setSaving(true);
    try {
      await subscriptionApi.createFromCatalog({
        service_id: subscribing.serviceId,
        plan_id: subscribing.plan.id,
        start_date: startDate,
        next_billing_date: nextDate,
      });
      toast.success("구독이 등록되었습니다!");
      setSubscribing(null);
      navigate("/subscriptions");
    } catch {
      toast.error("구독 등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // Service detail view
  if (selectedServiceId) {
    return (
      <div>
        <h2 className="mb-6 text-2xl font-bold text-gray-900">서비스 상세</h2>
        <ServiceDetail
          serviceId={selectedServiceId}
          onBack={() => setSelectedServiceId(null)}
          onSubscribe={(serviceId, plan) =>
            setSubscribing({ serviceId, plan })
          }
        />

        {/* Subscribe modal */}
        <SubscriptionModal
          isOpen={!!subscribing}
          onClose={() => setSubscribing(null)}
          title="구독 등록"
        >
          {subscribing && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="font-semibold text-blue-900">
                  {subscribing.plan.name}
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {subscribing.plan.currency === "USD" && "$"}
                  {new Intl.NumberFormat("ko-KR").format(subscribing.plan.price)}
                  {subscribing.plan.currency === "KRW" && "원"}
                  <span className="text-sm font-normal text-blue-500">
                    /{subscribing.plan.billing_cycle === "monthly" ? "월" : subscribing.plan.billing_cycle === "yearly" ? "년" : subscribing.plan.billing_cycle}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  구독 시작일
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  다음 결제일
                </label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSubscribing(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSubscribe}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "등록 중..." : "구독 등록"}
                </button>
              </div>
            </div>
          )}
        </SubscriptionModal>
      </div>
    );
  }

  // Service list view
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">서비스 탐색</h2>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedCategory(undefined);
          }}
          placeholder="서비스 검색 (예: Netflix, Spotify...)"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Category tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setSelectedCategory(undefined);
            setSearch("");
          }}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !selectedCategory && !search
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setSearch("");
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Service list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 py-12 text-center">
          <p className="text-gray-500">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {services.map((svc) => (
            <ServiceCard
              key={svc.id}
              service={svc}
              onClick={setSelectedServiceId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
