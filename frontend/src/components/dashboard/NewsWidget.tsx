import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { getNewsSummary } from "../../api/news";
import type { NewsItem } from "../../api/news";

interface NewsWidgetProps {
  news: NewsItem[];
  loading: boolean;
  error: string | null;
}

const AI_HERO =
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop";

function formatDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function NewsModal({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  const isAI = item.category === "AI Updates";
  const label = isAI ? "AI 소식" : "구독 알림";
  const date = formatDate(item.pub_date);

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryMode, setSummaryMode] = useState<"loading" | "ai" | "unavailable">("loading");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    setSummaryMode("loading");
    getNewsSummary(item)
      .then((res) => {
        if (!alive) return;
        if (res.mode === "ai" && res.summary) {
          setSummary(res.summary);
          setSummaryMode("ai");
        } else {
          setSummaryMode("unavailable");
        }
      })
      .catch(() => {
        if (alive) setSummaryMode("unavailable");
      });
    return () => {
      alive = false;
    };
  }, [item]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow-sm transition hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 헤더 배너 */}
        <div
          className={`relative flex h-32 items-end p-5 ${
            isAI
              ? "bg-gradient-to-br from-indigo-900 to-slate-900"
              : "bg-gradient-to-br from-indigo-100 to-indigo-50"
          }`}
        >
          {isAI && (
            <div
              className="absolute inset-0 opacity-30 mix-blend-overlay"
              style={{
                backgroundImage: `url('${item.image_url ?? AI_HERO}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}
          <div className="relative z-10 flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                isAI ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {label}
            </span>
            {item.matched && (
              <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                내 구독
              </span>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6">
          <h2 className="text-lg font-bold leading-snug text-slate-900">
            {item.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">{item.source}</span>
            {date && (
              <>
                <span aria-hidden>·</span>
                <span>{date}</span>
              </>
            )}
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
            {summaryMode === "loading" && (
              <div className="flex items-center gap-2 text-slate-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                AI 요약 생성 중…
              </div>
            )}
            {summaryMode === "ai" && (
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  AI 요약 · 헤드라인 기반
                </span>
                <p className="whitespace-pre-line">{summary}</p>
              </div>
            )}
            {summaryMode === "unavailable" && (
              <p className="text-slate-500">
                {isAI
                  ? "AI가 이 소식의 핵심을 요약한 제목이에요. 전체 기사는 원문에서 확인하세요."
                  : "구독 서비스 관련 소식이에요. 자세한 내용은 원문에서 확인하세요."}
              </p>
            )}
          </div>

          {/* 출처 (원문 링크) */}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-400">
              출처 · {item.source}
            </span>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-glass inline-flex items-center gap-2 px-4 py-2 text-sm"
            >
              원문 보기
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewsWidget({ news, loading, error }: NewsWidgetProps) {
  const [selected, setSelected] = useState<NewsItem | null>(null);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-3xl bg-white/70 p-5 shadow-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-48 items-center justify-center rounded-3xl bg-rose-50 p-5 text-sm text-rose-500 shadow-sm">
        소식을 불러오지 못했습니다.
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-3xl bg-white/70 p-5 text-sm text-slate-500 shadow-sm">
        최신 소식이 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {news.slice(0, 4).map((item, idx) => {
          const isAI = item.category === "AI Updates";
          const bgClass = isAI
            ? "bg-gradient-to-br from-indigo-900 to-slate-900 text-white"
            : "bg-white text-slate-900";
          const label = isAI ? "AI 소식" : "구독 알림";

          return (
            <button
              key={`${item.title}-${idx}`}
              type="button"
              onClick={() => setSelected(item)}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl p-4 text-left shadow-sm transition hover:shadow-md ${bgClass} ${
                idx >= 2 ? "col-span-2 h-32" : "col-span-1 h-48"
              }`}
            >
              {isAI && (
                <div
                  className="absolute inset-0 z-0 opacity-25 mix-blend-overlay transition duration-500 group-hover:scale-105 group-hover:opacity-40"
                  style={{
                    backgroundImage: `url('${AI_HERO}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              )}

              <div className="relative z-10 flex items-start justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    isAI ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {label}
                </span>
                {item.matched && (
                  <span className="rounded-full bg-emerald-500/90 px-2 py-1 text-[10px] font-semibold text-white">
                    내 구독
                  </span>
                )}
              </div>

              <div className="relative z-10 mt-auto">
                <h3 className={`line-clamp-2 text-sm font-bold leading-tight ${isAI ? "text-white" : "text-slate-900"}`}>
                  {item.title}
                </h3>
                <div className="mt-2 flex items-center justify-between">
                  <p className={`w-2/3 truncate text-[10px] ${isAI ? "text-indigo-100" : "text-slate-500"}`}>
                    {item.source}
                  </p>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      isAI ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected && <NewsModal item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
