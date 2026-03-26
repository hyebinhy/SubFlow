import type { OverlapItem } from "../../types/analytics";

interface Props {
  overlaps: OverlapItem[];
}

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export default function OverlapWarning({ overlaps }: Props) {
  if (overlaps.length === 0) return null;

  return (
    <div className="glass border border-amber-200/60 bg-amber-50/30 p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-lg">
          ⚠️
        </div>
        <h3 className="text-lg font-semibold text-amber-900">
          중복 구독 감지
        </h3>
        <span className="ml-auto rounded-xl bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          {overlaps.length}건
        </span>
      </div>

      <div className="space-y-3">
        {overlaps.map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-white/50 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{item.category_icon ?? "📂"}</span>
              <span className="text-sm font-semibold text-amber-900">
                {item.category}
              </span>
              <span className="ml-auto text-sm font-bold text-amber-700">
                월 {fmt(item.total_monthly_cost)}원
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.services.map((svc) => (
                <span
                  key={svc}
                  className="rounded-lg bg-amber-100/80 px-2 py-0.5 text-xs font-medium text-amber-800"
                >
                  {svc}
                </span>
              ))}
            </div>

            <p className="mt-2 text-xs text-amber-700/80">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
