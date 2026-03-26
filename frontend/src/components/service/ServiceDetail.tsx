import { useEffect, useState } from "react";
import { serviceApi } from "../../api/services";
import type { Service, ServicePlan } from "../../types/service";
import PlanSelector from "./PlanSelector";

interface Props {
  serviceId: number;
  onSubscribe: (serviceId: number, plan: ServicePlan) => void;
  onBack: () => void;
}

export default function ServiceDetail({ serviceId, onSubscribe, onBack }: Props) {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    serviceApi
      .getById(serviceId)
      .then(setService)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "서비스 정보를 불러오는데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  }, [serviceId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button
          onClick={onBack}
          className="mb-4 text-sm text-slate-400 hover:text-slate-500"
        >
          &larr; 서비스 목록으로
        </button>
        <div className="glass border-red-200/60 bg-red-50/50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!service) return null;

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm text-slate-400 hover:text-slate-500"
      >
        &larr; 서비스 목록으로
      </button>

      <div className="glass p-6">
        <div className="flex items-center gap-4">
          {service.logo_url ? (
            <img
              src={service.logo_url}
              alt={service.name}
              className="h-16 w-16 rounded-xl object-contain"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl"
              style={{ backgroundColor: service.category?.color ?? "#E5E7EB" }}
            >
              {service.category?.icon ?? "💳"}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-slate-900">{service.name}</h2>
            <p className="text-sm text-slate-400">{service.description}</p>
            {service.website_url && (
              <a
                href={service.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline"
              >
                공식 사이트 &rarr;
              </a>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">
            요금제 선택
          </h3>
          <PlanSelector
            plans={service.plans.filter((p) => p.is_active)}
            onSelect={(plan) => onSubscribe(service.id, plan)}
          />
        </div>
      </div>
    </div>
  );
}
