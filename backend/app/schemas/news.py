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

class NewsResponse(BaseModel):
    items: List[NewsItem]
