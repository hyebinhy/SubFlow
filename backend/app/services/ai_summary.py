import json

from app.config import settings

# 요약 결과를 입력과 동일한 개수·순서의 문자열 배열로 강제
_SCHEMA = {
    "type": "object",
    "properties": {
        "summaries": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["summaries"],
    "additionalProperties": False,
}

_PROMPT = (
    "다음은 AI 관련 뉴스 헤드라인 목록입니다. 각 항목을 구독 관리 앱의 뉴스 카드에 어울리는 "
    "간결하고 매끄러운 한국어 한 줄(최대 40자)로 다듬어 주세요. 언론사명·따옴표·대괄호는 제거하고 "
    "핵심만 남기세요. 입력과 정확히 같은 개수·같은 순서로 summaries 배열에 담아 반환하세요.\n\n"
)


async def summarize_titles(titles: list[str]) -> list[str] | None:
    """AI 뉴스 제목을 Claude(haiku)로 다듬는다.
    API 키 미설정·SDK 미설치·호출 실패 시 None을 반환해 호출부가 원문을 유지하게 한다.
    """
    if not titles or not settings.ANTHROPIC_API_KEY:
        return None
    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        return None

    numbered = "\n".join(f"{i + 1}. {t}" for i, t in enumerate(titles))
    client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    try:
        resp = await client.messages.create(
            model="claude-haiku-4-5",  # 저렴한 요약용 모델
            max_tokens=1024,
            output_config={"format": {"type": "json_schema", "schema": _SCHEMA}},
            messages=[{"role": "user", "content": _PROMPT + numbered}],
        )
        text = "".join(b.text for b in resp.content if b.type == "text")
        summaries = json.loads(text).get("summaries")
        if isinstance(summaries, list) and len(summaries) == len(titles):
            return [str(s).strip() for s in summaries]
    except Exception as exc:  # 실패는 원문 유지로 흡수
        print(f"[ai_summary] skipped: {exc}")
    finally:
        await client.close()
    return None
