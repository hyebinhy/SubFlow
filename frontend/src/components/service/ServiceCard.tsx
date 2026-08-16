import { CreditCard } from "lucide-react";
import type { ServiceListItem } from "../../types/service";
import { tr } from "../../i18n/translations";
import { toKrw, type RateTable } from "../../utils/currency";

interface Props {
  service: ServiceListItem;
  onClick: (id: number) => void;
  /** 원화 환산 보기. 켜져 있으면 외화 요금을 원화로 바꿔 보여준다. */
  showKrw?: boolean;
  rates?: RateTable;
}

export default function ServiceCard({ service, onClick, showKrw, rates }: Props) {
  const krw =
    showKrw && rates && service.min_price
      ? toKrw(service.min_price, service.currency ?? "KRW", rates)
      : null;
  const priceDisplay = krw
    ? `${new Intl.NumberFormat("ko-KR").format(krw)}${tr("원")}~`
    : service.min_price
    ? `${new Intl.NumberFormat("ko-KR").format(service.min_price)}${service.currency === "KRW" ? tr("원") : "$"}~`
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
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-slate-500 ${service.logo_url ? "hidden" : ""}`}
        style={{ backgroundColor: service.category?.color ?? "#E5E7EB" }}
      >
        <CreditCard className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900">{service.name}</h3>
          {service.is_popular && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">{tr("인기")}</span>
          )}
        </div>
        <p className="truncate text-sm text-slate-400">
          {service.description}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-slate-900">{priceDisplay}</p>
        <p className="text-xs text-slate-400">{tr("{n}개 요금제", { n: service.plan_count })}</p>
      </div>
    </button>
  );
}
