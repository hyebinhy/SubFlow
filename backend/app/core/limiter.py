import sys

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.config import settings


def _client_ip(request: Request) -> str:
    """rate limit 키로 쓸 클라이언트 IP.
    리버스 프록시 뒤(TRUST_PROXY=True)에서는 X-Forwarded-For의 첫 IP를 신뢰.
    그렇지 않으면 직접 연결 IP만 사용 (헤더 스푸핑 방지).
    """
    if settings.TRUST_PROXY:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.split(",")[0].strip()
    return get_remote_address(request)


# 클라이언트 IP 기준 rate limiter (라우터·앱에서 공용으로 import)
# 테스트(pytest) 중에는 비활성화해 register/login 반복 호출이 429로 막히지 않게 한다.
limiter = Limiter(key_func=_client_ip, enabled="pytest" not in sys.modules)
