"""'월 단위 KRW' 환산 기준이 통화·결제주기 조합 전체에서 하나로 유지되는지 고정한다.

대시보드 총액과 개별 구독 금액이 같은 기준이어야 지출 비중 계산이 성립한다.
환산 진입점(`app.utils.cost`)이 흔들리면 화면마다 다른 총액이 나오므로,
통화 2종 × 결제주기 4종 = 8가지 조합을 여기서 못 박아 둔다.
"""

from decimal import Decimal

import pytest

from app.models.subscription import BillingCycle
from app.utils import exchange_rate
from app.utils.cost import to_monthly_cost, to_monthly_cost_krw

# conftest의 autouse DB 픽스처를 이 모듈에서만 비활성화한다(순수 함수 테스트라 DB가 필요 없다).
@pytest.fixture(autouse=True)
def test_db():
    yield None


USD_KRW = Decimal("1300")


@pytest.fixture(autouse=True)
def _fixed_rate(monkeypatch):
    """환율을 고정해 환산 결과가 외부 API에 흔들리지 않게 한다."""

    async def _rates():
        return {"KRW": Decimal("1"), "USD": USD_KRW}

    monkeypatch.setattr(exchange_rate, "get_exchange_rates", _rates)


# ── 결제주기 환산 (통화 무관) ──

@pytest.mark.parametrize(
    ("cycle", "cost", "expected_monthly"),
    [
        (BillingCycle.WEEKLY, Decimal("10000"), Decimal("43300")),
        (BillingCycle.MONTHLY, Decimal("10000"), Decimal("10000")),
        (BillingCycle.QUARTERLY, Decimal("30000"), Decimal("10000")),
        (BillingCycle.YEARLY, Decimal("120000"), Decimal("10000")),
    ],
)
def test_to_monthly_cost_per_cycle(cycle, cost, expected_monthly):
    assert to_monthly_cost(cost, cycle) == expected_monthly


def test_to_monthly_cost_keeps_decimal():
    """부동소수점으로 새면 합산할수록 오차가 쌓인다. Decimal을 유지해야 한다."""
    result = to_monthly_cost(Decimal("120000"), BillingCycle.YEARLY)
    assert isinstance(result, Decimal)


# ── 통화 2종 × 주기 4종 = 8가지 조합 ──

@pytest.mark.parametrize(
    ("currency", "cycle", "cost", "expected_krw"),
    [
        ("KRW", BillingCycle.WEEKLY, Decimal("10000"), Decimal("43300")),
        ("KRW", BillingCycle.MONTHLY, Decimal("10000"), Decimal("10000")),
        ("KRW", BillingCycle.QUARTERLY, Decimal("30000"), Decimal("10000")),
        ("KRW", BillingCycle.YEARLY, Decimal("120000"), Decimal("10000")),
        ("USD", BillingCycle.WEEKLY, Decimal("10"), Decimal("56290")),
        ("USD", BillingCycle.MONTHLY, Decimal("10"), Decimal("13000")),
        ("USD", BillingCycle.QUARTERLY, Decimal("30"), Decimal("13000")),
        ("USD", BillingCycle.YEARLY, Decimal("120"), Decimal("13000")),
    ],
)
@pytest.mark.asyncio
async def test_monthly_krw_across_currency_and_cycle(currency, cycle, cost, expected_krw):
    assert await to_monthly_cost_krw(cost, cycle, currency) == expected_krw


@pytest.mark.asyncio
async def test_same_real_amount_converges_regardless_of_cycle():
    """같은 실질 금액이면 결제주기가 달라도 월 환산값이 같아야 한다."""
    monthly = await to_monthly_cost_krw(Decimal("10"), BillingCycle.MONTHLY, "USD")
    quarterly = await to_monthly_cost_krw(Decimal("30"), BillingCycle.QUARTERLY, "USD")
    yearly = await to_monthly_cost_krw(Decimal("120"), BillingCycle.YEARLY, "USD")
    assert monthly == quarterly == yearly


@pytest.mark.asyncio
async def test_total_equals_sum_of_items():
    """총액을 따로 계산해도 개별 항목의 합과 어긋나면 안 된다."""
    items = [
        (Decimal("10"), BillingCycle.MONTHLY, "USD"),
        (Decimal("120"), BillingCycle.YEARLY, "USD"),
        (Decimal("10000"), BillingCycle.MONTHLY, "KRW"),
        (Decimal("30000"), BillingCycle.QUARTERLY, "KRW"),
    ]
    per_item = [await to_monthly_cost_krw(c, cy, cur) for c, cy, cur in items]
    total = sum(per_item, Decimal("0"))
    assert total == Decimal("46000")
    assert total == sum(per_item)
