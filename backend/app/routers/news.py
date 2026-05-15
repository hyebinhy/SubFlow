import asyncio
import xml.etree.ElementTree as ET
from typing import List

import httpx
from fastapi import APIRouter

from app.schemas.news import NewsItem, NewsResponse

router = APIRouter()

FALLBACK_NEWS = [
    NewsItem(
        title="GPT-5.5 공개 이후 업무 자동화 기능 업데이트가 늘고 있습니다",
        link="https://openai.com/",
        pub_date="",
        source="SubFlow Brief",
        image_url=None,
        category="AI Updates",
    ),
    NewsItem(
        title="주요 구독 서비스의 요금제 변경을 확인해보세요",
        link="https://support.google.com/",
        pub_date="",
        source="SubFlow Brief",
        image_url=None,
        category="Price Alerts",
    ),
    NewsItem(
        title="연간 결제 전환 전, 월간 사용 빈도와 중복 구독을 먼저 점검하세요",
        link="https://www.subflow.local/",
        pub_date="",
        source="SubFlow Tip",
        image_url=None,
        category="Price Alerts",
    ),
]


async def fetch_rss(query: str, category: str, max_items: int = 3) -> List[NewsItem]:
    url = f"https://news.google.com/rss/search?q={query}&hl=ko&gl=KR&ceid=KR:ko"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=2.0)
            response.raise_for_status()

        root = ET.fromstring(response.text)
        items = []

        for item in root.findall(".//item")[:max_items]:
            title = item.findtext("title", default="")
            link = item.findtext("link", default="")
            pub_date = item.findtext("pubDate", default="")
            source = item.findtext("source", default="Google News")

            if " - " in title:
                title = " - ".join(title.split(" - ")[:-1])

            items.append(
                NewsItem(
                    title=title,
                    link=link,
                    pub_date=pub_date,
                    source=source,
                    image_url=None,
                    category=category,
                )
            )
        return items
    except Exception as exc:
        print(f"Error fetching RSS for {query}: {exc}")
        return []


@router.get("/", response_model=NewsResponse)
async def get_news():
    # Keep the dashboard fast and predictable. Live RSS fetching can be moved to
    # a background cache later so page rendering never waits on an external site.
    return NewsResponse(items=FALLBACK_NEWS)
