import { AlertTriangle, Folder } from "lucide-react";
import type { OverlapItem } from "../../types/analytics";

interface Props {
  overlaps: OverlapItem[];
}

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export default function OverlapWarning({ overlaps }: Props) {
  if (overlaps.length === 0) return null;

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100/80 text-amber-600">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">중복 구독 감지</h3>
        <span className="ml-auto rounded-xl bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {overlaps.length}건
        </span>
      </div>

      <div className="space-y-3">
        {overlaps.map((item, idx) => (
          <div key={idx} className="rounded-2xl bg-slate-50 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                <Folder className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-semibold text-slate-800">{item.category}</span>
              <span className="ml-auto text-sm font-bold text-slate-700">월 {fmt(item.total_monthly_cost)}원</span>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.services.map((svc) => (
                <span key={svc} className="rounded-lg bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-sm">
                  {svc}
                </span>
              ))}
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
