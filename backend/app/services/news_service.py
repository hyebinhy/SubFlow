import time
import xml.etree.ElementTree as ET
from urllib.parse import quote

import httpx
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.news_cache import NewsCache
from app.services.ai_summary import summarize_article, summarize_titles

# 링크별 AI 요약 인메모리 캐시 (동일 기사 재요청 시 API 호출 절약)
_SUMMARY_CACHE: dict[str, tuple[float, str]] = {}
_SUMMARY_TTL = 24 * 3600  # 24시간


async def build_news_summary(title: str, link: str, source: str = "", category: str = "") -> dict:
    """카드 모달용 요약을 반환. mode: 'ai'(생성됨) | 'unavailable'(키 미설정·실패)."""
    now = time.time()
    cached = _SUMMARY_CACHE.get(link)
    if cached and now - cached[0] < _SUMMARY_TTL:
        return {"summary": cached[1], "mode": "ai"}

    summary = await summarize_article(title, source, category)
    if summary:
        _SUMMARY_CACHE[link] = (now, summary)
        return {"summary": summary, "mode": "ai"}
    return {"summary": None, "mode": "unavailable"}

# 수집 대상: (검색어, 카테고리, 최대 개수)
NEWS_QUERIES: list[tuple[str, str, int]] = [
    ('("GPT-5" OR "Claude" OR "Gemini" OR "AI 에이전트") (출시 OR 공개 OR 업데이트)', "AI Updates", 6),
    ("구독 서비스 (요금 인상 OR 구독료 인상 OR 가격 인상)", "Price Alerts", 6),
]

# 캐시가 비었을 때만 쓰는 최소 폴백
FALLBACK: list[dict] = [
    {
        "title": "GPT-5.5 공개 이후 업무 자동화 기능 업데이트가 늘고 있습니다",
        "link": "https://openai.com/",
        "pub_date": "",
        "source": "SubFlow Brief",
        "image_url": None,
        "category": "AI Updates",
    },
    {
        "title": "주요 구독 서비스의 요금제 변경을 확인해보세요",
        "link": "https://support.google.com/",
        "pub_date": "",
        "source": "SubFlow Brief",
        "image_url": None,
        "category": "Price Alerts",
    },
]


async def _fetch_rss(query: str, category: str, max_items: int) -> list[dict]:
    url = f"https://news.google.com/rss/search?q={quote(query)}&hl=ko&gl=KR&ceid=KR:ko"
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
        root = ET.fromstring(resp.text)
    except Exception as exc:  # 네트워크/파싱 실패는 조용히 스킵
        print(f"[news] fetch failed for {category!r}: {exc}")
        return []

    items: list[dict] = []
    for item in root.findall(".//item")[:max_items]:
        title = item.findtext("title", default="").strip()
        link = item.findtext("link", default="").strip()
        if not title or not link:
            continue
        # Google News 제목의 " - 언론사" 꼬리 제거
        if " - " in title:
            title = " - ".join(title.split(" - ")[:-1])
        source = item.findtext("source", default="Google News").strip() or "Google News"
        items.append(
            {
                "title": title[:500],
                "link": link[:1000],
                "pub_date": item.findtext("pubDate", default="").strip()[:100],
                "source": source[:200],
                "image_url": None,
                "category": category,
            }
        )
    return items


async def refresh_news_cache(db: AsyncSession) -> int:
    """모든 쿼리를 수집해 캐시에 upsert. 갱신된 건수를 반환."""
    collected: list[dict] = []
    for query, category, max_items in NEWS_QUERIES:
        collected.extend(await _fetch_rss(query, category, max_items))

    if not collected:
        return 0

    # AI 뉴스 제목은 Claude로 카드용 한 줄로 다듬는다 (키 없으면 원문 유지)
    ai_items = [r for r in collected if r["category"] == "AI Updates"]
    if ai_items:
        summaries = await summarize_titles([r["title"] for r in ai_items])
        if summaries:
            for row, summary in zip(ai_items, summaries):
                if summary:
                    row["title"] = summary[:500]
                    row["source"] = "SubFlow Brief"

    # 이번 수집에 포함된 링크는 fetched_at 갱신, 신규는 삽입 (link 유니크 기준 upsert)
    for row in collected:
        stmt = pg_insert(NewsCache).values(**row)
        stmt = stmt.on_conflict_do_update(
            index_elements=["link"],
            set_={"title": row["title"], "pub_date": row["pub_date"], "source": row["source"]},
        )
        await db.execute(stmt)

    # 오래된 항목 정리: 카테고리별 최신 20개만 유지
    for _, category, _ in NEWS_QUERIES:
        keep_ids = (
            await db.execute(
                select(NewsCache.id)
                .where(NewsCache.category == category)
                .order_by(NewsCache.fetched_at.desc())
                .limit(20)
            )
        ).scalars().all()
        if keep_ids:
            await db.execute(
                delete(NewsCache).where(
                    NewsCache.category == category,
                    NewsCache.id.notin_(keep_ids),
                )
            )

    await db.commit()
    return len(collected)


# 카탈로그 영문명 ↔ 한글 뉴스 매칭용 별칭 (뉴스에 자주 등장하는 서비스 위주)
SERVICE_ALIASES: dict[str, list[str]] = {
    "Netflix": ["netflix", "넷플릭스"],
    "YouTube Premium": ["youtube", "유튜브"],
    "YouTube Music": ["youtube", "유튜브"],
    "Disney+": ["disney", "디즈니"],
    "Wavve": ["wavve", "웨이브"],
    "Tving": ["tving", "티빙"],
    "Watcha": ["watcha", "왓챠"],
    "Apple TV+": ["apple tv", "애플tv", "애플 tv"],
    "Apple Music": ["apple music", "애플뮤직", "애플 뮤직"],
    "Coupang Play": ["쿠팡플레이", "쿠팡 플레이"],
    "Amazon Prime Video": ["amazon prime", "아마존", "프라임 비디오"],
    "Amazon Prime": ["amazon prime", "아마존", "프라임"],
    "Spotify": ["spotify", "스포티파이"],
    "Melon": ["melon", "멜론"],
    "ChatGPT Plus": ["chatgpt", "챗gpt", "gpt", "openai", "오픈ai", "오픈에이아이"],
    "Claude Pro": ["claude", "클로드", "anthropic"],
    "Perplexity Pro": ["perplexity", "퍼플렉시티"],
    "Midjourney": ["midjourney", "미드저니"],
    "GitHub Copilot": ["copilot", "코파일럿"],
    "Cursor": ["cursor", "커서"],
    "Notion": ["notion", "노션"],
    "Figma": ["figma", "피그마"],
    "Adobe Creative Cloud": ["adobe", "어도비"],
    "Microsoft 365": ["microsoft 365", "마이크로소프트", "오피스"],
    "Google One": ["google one", "구글 원"],
    "PlayStation Plus": ["playstation", "플레이스테이션", "ps플러스", "ps plus", "psn"],
    "Xbox Game Pass": ["xbox", "엑스박스", "게임패스", "game pass"],
    "Nintendo Switch Online": ["nintendo", "닌텐도", "스위치"],
    "Discord Nitro": ["discord", "디스코드", "니트로"],
    "쿠팡 로켓와우": ["쿠팡", "로켓와우"],
    "배민클럽": ["배민", "배달의민족"],
    "네이버 플러스 멤버십": ["네이버플러스", "네이버 플러스", "네이버 멤버십"],
}


def _match_tokens(service_name: str) -> list[str]:
    tokens = list(SERVICE_ALIASES.get(service_name, []))
    low = service_name.lower()
    if len(low) >= 4 and low not in tokens:  # 짧은 이름의 오탐 방지
        tokens.append(low)
    return tokens


def personalize_news(items: list[dict], service_names: list[str], only_matched: bool = False) -> list[dict]:
    """뉴스 제목에 내 구독 서비스가 언급되면 matched 표시하고 상단으로 정렬."""
    tokens: set[str] = set()
    for name in service_names:
        tokens.update(_match_tokens(name))

    for it in items:
        title = it.get("title", "").lower()
        it["matched"] = any(tok in title for tok in tokens)

    if only_matched:
        items = [it for it in items if it["matched"]]
    # matched 우선, 나머지는 기존 순서 유지 (안정 정렬)
    items.sort(key=lambda it: not it.get("matched"))
    return items


def _to_dict(r: NewsCache) -> dict:
    return {
        "title": r.title,
        "link": r.link,
        "pub_date": r.pub_date or "",
        "source": r.source,
        "image_url": r.image_url,
        "category": r.category,
    }


async def get_cached_news(db: AsyncSession, limit: int = 6) -> list[dict]:
    """캐시에서 카테고리를 번갈아 섞어 반환 (한 카테고리가 목록을 독점하지 않도록). 비면 폴백."""
    categories = [cat for _, cat, _ in NEWS_QUERIES]
    per_cat: dict[str, list[NewsCache]] = {}
    for cat in categories:
        rows = (
            await db.execute(
                select(NewsCache)
                .where(NewsCache.category == cat)
                .order_by(NewsCache.fetched_at.desc())
                .limit(limit)
            )
        ).scalars().all()
        per_cat[cat] = list(rows)

    # 라운드로빈 인터리브
    interleaved: list[dict] = []
    idx = 0
    while len(interleaved) < limit and any(idx < len(per_cat[c]) for c in categories):
        for cat in categories:
            if idx < len(per_cat[cat]) and len(interleaved) < limit:
                interleaved.append(_to_dict(per_cat[cat][idx]))
        idx += 1

    return interleaved or FALLBACK
