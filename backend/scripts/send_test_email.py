"""SMTP 설정이 실제로 동작하는지 한 통 보내 확인한다.

    python scripts/send_test_email.py you@example.com

.env의 SMTP_* 값을 그대로 쓴다. 실패하면 원인을 그대로 보여준다 —
Resend는 보통 다음 둘에서 막힌다.
  1) SMTP_FROM 도메인을 Resend에서 인증(DNS)하지 않음
  2) API 키 오타 / 권한 부족
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings  # noqa: E402
from app.services.delivery_service import send_email  # noqa: E402


async def main() -> None:
    if len(sys.argv) < 2:
        print("사용법: python scripts/send_test_email.py <받는주소>")
        raise SystemExit(1)
    to = sys.argv[1]

    print(f"HOST={settings.SMTP_HOST or '(비어 있음)'}  PORT={settings.SMTP_PORT}")
    print(f"USER={settings.SMTP_USER or '(비어 있음)'}  TLS={settings.SMTP_TLS}")
    print(f"FROM={settings.SMTP_FROM}")
    print(f"PASSWORD={'설정됨' if settings.SMTP_PASSWORD else '(비어 있음)'}")

    if not settings.SMTP_HOST:
        print("\nSMTP_HOST가 비어 있어 발송을 시도하지 않습니다(.env를 확인하세요).")
        raise SystemExit(1)

    ok = await send_email(
        to,
        "[SubFlow] SMTP 테스트",
        "이 메일이 보인다면 SubFlow의 이메일 발송 설정이 정상입니다.\n"
        "비밀번호 재설정과 이메일 인증 메일이 이 경로로 나갑니다.\n",
    )
    print("\n결과:", "발송 성공" if ok else "발송 실패 (위 오류 메시지를 확인하세요)")
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    asyncio.run(main())
