"""Real-time exchange rate utility using Frankfurter API (free, no key required).

Rates are cached for 1 hour to avoid excessive API calls.
"""

import time
from decimal import Decimal

import httpx

_cache: dict[str, tuple[float, dict[str, Decimal]]] = {}
_CACHE_TTL = 3600  # 1 hour
# Frankfurter는 ECB 고시 환율이라 '영업일 1회' 갱신된다(실시간 시세가 아니다).
# 응답의 date를 그대로 보관해 UI가 언제 기준인지 밝힐 수 있게 한다.
_as_of: str | None = None

FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest"
BASE_CURRENCY = "KRW"

# Fallback rates in case API is unreachable
_FALLBACK_RATES: dict[str, Decimal] = {
    "USD": Decimal("1380"),
    "EUR": Decimal("1500"),
    "JPY": Decimal("9.2"),
    "GBP": Decimal("1750"),
    "KRW": Decimal("1"),
}


async def _fetch_rates() -> dict[str, Decimal]:
    """Fetch exchange rates from Frankfurter API. Returns rates as 1 FOREIGN = X KRW."""
    global _as_of
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Get rates with KRW as target from USD base
            resp = await client.get(
                FRANKFURTER_URL,
                params={"from": "USD", "to": "KRW"},
            )
            resp.raise_for_status()
            data = resp.json()
            usd_to_krw = Decimal(str(data["rates"]["KRW"]))
            _as_of = data.get("date")

            # Now get all rates relative to USD
            resp2 = await client.get(
                FRANKFURTER_URL,
                params={"from": "USD"},
            )
            resp2.raise_for_status()
            data2 = resp2.json()

            # Convert: 1 FOREIGN = ? KRW
            # We know 1 USD = usd_to_krw KRW
            # For other currencies: 1 USD = X FOREIGN => 1 FOREIGN = usd_to_krw / X KRW
            rates: dict[str, Decimal] = {"KRW": Decimal("1"), "USD": usd_to_krw}
            for currency, usd_rate in data2["rates"].items():
                if currency == "KRW":
                    continue
                rate_decimal = Decimal(str(usd_rate))
                if rate_decimal > 0:
                    rates[currency] = (usd_to_krw / rate_decimal).quantize(Decimal("0.01"))

            return rates
    except Exception:
        return _FALLBACK_RATES


async def get_exchange_rates() -> dict[str, Decimal]:
    """Get cached exchange rates (1 FOREIGN = X KRW). Refreshes every hour."""
    cache_key = "rates"
    now = time.time()

    if cache_key in _cache:
        cached_time, cached_rates = _cache[cache_key]
        if now - cached_time < _CACHE_TTL:
            return cached_rates

    rates = await _fetch_rates()
    _cache[cache_key] = (now, rates)
    return rates


async def get_rates_as_of() -> str | None:
    """환율 기준일(YYYY-MM-DD). 아직 한 번도 못 받았으면 None(폴백 환율 사용 중)."""
    await get_exchange_rates()  # 캐시 워밍 겸
    return _as_of


async def to_krw(amount: Decimal, currency: str) -> Decimal:
    """Convert an amount from any currency to KRW using real-time exchange rates."""
    if currency == "KRW":
        return amount

    rates = await get_exchange_rates()
    rate = rates.get(currency.upper(), _FALLBACK_RATES.get(currency.upper(), Decimal("1380")))
    return (amount * rate).quantize(Decimal("1"))
