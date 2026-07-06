from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class NewsItem(BaseModel):
    title: str
    link: str
    pub_date: str
    source: str
    image_url: Optional[str] = None
    category: str
    matched: bool = False  # 내가 구독한 서비스와 관련된 뉴스인지

class NewsResponse(BaseModel):
    items: List[NewsItem]


class NewsSummaryRequest(BaseModel):
    title: str
    link: str
    source: str = ""
    category: str = ""


class NewsSummaryResponse(BaseModel):
    summary: Optional[str] = None
    mode: str  # "ai" | "unavailable"
