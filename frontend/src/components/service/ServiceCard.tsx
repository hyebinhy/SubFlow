import type { ServiceListItem } from "../../types/service";

interface Props {
  service: ServiceListItem;
  onClick: (id: number) => void;
}

export default function ServiceCard({ service, onClick }: Props) {
  const priceDisplay = service.min_price
    ? `${new Intl.NumberFormat("ko-KR").format(service.min_price)}${service.currency === "KRW" ? "원" : "$"}~`
    : "";

  return (
    <button
      onClick={() => onClick(service.id)}
      className="glass flex w-full items-center gap-4 p-4 text-left transition-all hover:border-blue-300/60 hover:shadow-md"
    >
      {service.logo_url ? (
        <img
          src={service.logo_url}
          alt={service.name}
          className="h-12 w-12 shrink-0 rounded-lg object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
      ) : null}
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl ${service.logo_url ? "hidden" : ""}`}
        style={{ backgroundColor: service.category?.color ?? "#E5E7EB" }}
      >
        {service.category?.icon ?? "💳"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900">{service.name}</h3>
          {service.is_popular && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              인기
            </span>
          )}
        </div>
        <p className="truncate text-sm text-slate-400">
          {service.description}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-slate-900">{priceDisplay}</p>
        <p className="text-xs text-slate-400">{service.plan_count}개 요금제</p>
      </div>
    </button>
  );
}
