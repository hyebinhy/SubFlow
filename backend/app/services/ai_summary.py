import json

from app.config import settings

# ── 카드 제목 다듬기 (뉴스 수집 시 AI 헤드라인 정리) ──
_TITLE_PROMPT = (
    "다음은 AI 관련 뉴스 헤드라인 목록입니다. 각 항목을 구독 관리 앱의 뉴스 카드에 어울리는 "
    "간결하고 매끄러운 한국어 한 줄(최대 40자)로 다듬어 주세요. 언론사명·따옴표·대괄호는 제거하고 "
    "핵심만 남기세요. 입력과 정확히 같은 개수·같은 순서로 반환하되, "
    '반드시 JSON 객체 {"summaries": ["...", "..."]} 형식으로만 응답하세요.\n\n'
)

# ── 카드 모달용 3~4문장 요약 ──
_ARTICLE_PROMPT = (
    "당신은 구독 관리 앱의 뉴스 에디터입니다. 아래 뉴스 헤드라인을 바탕으로 사용자가 "
    "'무슨 내용인지' 빠르게 파악하도록 한국어로 3~4문장 요약을 작성하세요.\n"
    "규칙:\n"
    "- 헤드라인이 담은 사실만 활용하고, 헤드라인에 없는 구체적 수치·날짜·인용은 지어내지 마세요.\n"
    "- 마지막 문장은 구독 관리 관점의 시사점(요금·구독에 미칠 영향 등)을 담되, 확실하지 않으면 일반적으로 서술하세요.\n"
    "- 담백하고 매끄러운 문체로, 불릿 없이 문단으로 작성하세요.\n"
)

_MODEL = "gpt-4o-mini"  # 저렴한 요약용 모델


def _client():
    """AsyncOpenAI 클라이언트를 생성. 키 미설정·SDK 미설치 시 None."""
    if not settings.OPENAI_API_KEY:
        return None
    try:
        from openai import AsyncOpenAI
    except ImportError:
        return None
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def summarize_titles(titles: list[str]) -> list[str] | None:
    """AI 뉴스 제목을 OpenAI로 카드용 한 줄로 다듬는다.
    키 미설정·SDK 미설치·호출 실패 시 None을 반환해 호출부가 원문을 유지하게 한다.
    """
    if not titles:
        return None
    client = _client()
    if client is None:
        return None

    numbered = "\n".join(f"{i + 1}. {t}" for i, t in enumerate(titles))
    try:
        resp = await client.chat.completions.create(
            model=_MODEL,
            max_tokens=1024,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": _TITLE_PROMPT + numbered}],
        )
        text = resp.choices[0].message.content or ""
        summaries = json.loads(text).get("summaries")
        if isinstance(summaries, list) and len(summaries) == len(titles):
            return [str(s).strip() for s in summaries]
    except Exception as exc:  # 실패는 원문 유지로 흡수
        print(f"[ai_summary] titles skipped: {exc}")
    finally:
        await client.close()
    return None


async def summarize_article(title: str, source: str = "", category: str = "") -> str | None:
    """헤드라인을 바탕으로 카드 모달용 3~4문장 한국어 요약을 생성한다.
    (뉴스 링크가 원문으로 직접 연결되지 않아 본문 대신 헤드라인을 근거로 함)
    키 미설정·SDK 미설치·호출 실패 시 None.
    """
    if not title:
        return None
    client = _client()
    if client is None:
        return None

    user = f"{_ARTICLE_PROMPT}\n헤드라인: {title}\n매체: {source}\n분류: {category}\n"
    try:
        resp = await client.chat.completions.create(
            model=_MODEL,
            max_tokens=400,
            messages=[{"role": "user", "content": user}],
        )
        text = (resp.choices[0].message.content or "").strip()
        return text or None
    except Exception as exc:
        print(f"[ai_summary] article skipped: {exc}")
        return None
    finally:
        await client.close()
