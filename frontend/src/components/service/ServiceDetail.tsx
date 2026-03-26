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

  useEffect(() => {
    serviceApi
      .getById(serviceId)
      .then(setService)
      .finally(() => setLoading(false));
  }, [serviceId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!service) return null;

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; 서비스 목록으로
      </button>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
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
            <h2 className="text-xl font-bold text-gray-900">{service.name}</h2>
            <p className="text-sm text-gray-500">{service.description}</p>
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
          <h3 className="mb-3 text-lg font-semibold text-gray-900">
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
