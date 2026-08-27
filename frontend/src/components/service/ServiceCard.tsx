import { CreditCard, Trash2 } from "lucide-react";
import type { ServiceListItem } from "../../types/service";
import { tr } from "../../i18n/translations";
import { toKrw, type RateTable } from "../../utils/currency";

interface Props {
  service: ServiceListItem;
  onClick: (id: number) => void;
  /** 원화 환산 보기. 켜져 있으면 외화 요금을 원화로 바꿔 보여준다. */
  showKrw?: boolean;
  rates?: RateTable;
  /** 내가 등록한 서비스에만 넘어온다. 기본 카탈로그는 지울 수 없다. */
  onDelete?: (service: ServiceListItem) => void;
}

export default function ServiceCard({ service, onClick, showKrw, rates, onDelete }: Props) {
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
    // 지우기 버튼이 카드 안에 들어가야 해서 바깥은 div다. button 안에 button을
    // 넣으면 브라우저가 마크업을 고쳐 버려 클릭이 엉킨다.
    <div className="glass flex w-full items-center transition-all hover:border-blue-300/60 hover:shadow-md">
      <button
        onClick={() => onClick(service.id)}
        className="flex min-w-0 flex-1 items-center gap-4 p-4 text-left"
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
            {service.is_custom && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500">{tr("내 서비스")}</span>
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
      {onDelete && (
        <button
          onClick={() => onDelete(service)}
          aria-label={tr("삭제")}
          className="mr-3 shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
