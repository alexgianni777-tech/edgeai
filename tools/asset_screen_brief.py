"""AG Invest: turn existing screener candidate JSON into a Replit-ready decision brief.

Read-only presentation layer. No trading instructions, invented prices, or broker execution.
Usage: python -m tools.asset_screen_brief candidates.json
Expected input: {"as_of":"2026-10-29","generated_at":"...","regime":{...},"candidates":[...]}
Candidate fields: ticker, name, side, category, price, price_date, rsi, rs3m,
volume_ratio, atr_pct, stop, target, earnings_date, earnings_verified,
report_quality, flags, thesis, invalidation, source, confidence.
"""
import json
import sys
from datetime import date, datetime
from pathlib import Path

MAX_AGE_DAYS = 2

def _num(v):
    try:
        return float(v) if v is not None else None
    except (ValueError, TypeError):
        return None

def _date(v):
    try:
        return date.fromisoformat(str(v)[:10])
    except (TypeError, ValueError):
        return None

def evaluate(candidate, as_of, today=None):
    today = today or date.today()
    flags = list(candidate.get("flags") or [])
    price = _num(candidate.get("price"))
    stop = _num(candidate.get("stop"))
    target = _num(candidate.get("target"))
    side = str(candidate.get("side") or "").upper()
    dated = _date(candidate.get("price_date") or as_of)
    if not dated or (today - dated).days > MAX_AGE_DAYS or dated > today:
        flags.append("STALE_PRICE")
    if not candidate.get("earnings_verified", False):
        flags.append("EARNINGS_UNVERIFIED")
    earnings = _date(candidate.get("earnings_date"))
    if earnings and -1 <= (earnings - today).days <= 5:
        flags.append("EARNINGS_WINDOW")
    if not price or not stop or not target or side not in ("LONG", "SHORT"):
        flags.append("MISSING_TRADE_LEVELS")
        rr = None
    else:
        risk = price - stop if side == "LONG" else stop - price
        reward = target - price if side == "LONG" else price - target
        rr = round(reward / risk, 2) if risk > 0 and reward > 0 else None
        if rr is None or rr < 1.2:
            flags.append("LOW_OR_INVALID_RR")
    if _num(candidate.get("volume_ratio")) is not None and _num(candidate["volume_ratio"]) < 0.8:
        flags.append("WEAK_VOLUME")
    if candidate.get("data_mixed_dates"):
        flags.append("MIXED_DATA_DATES")
    hard = {"STALE_PRICE", "EARNINGS_UNVERIFIED", "EARNINGS_WINDOW",
            "MISSING_TRADE_LEVELS", "LOW_OR_INVALID_RR", "MIXED_DATA_DATES"}
    status = "BLOCKED" if hard.intersection(flags) else "WATCH"
    return status, list(dict.fromkeys(flags)), rr

def render(data, today=None):
    today = today or date.today()
    as_of = data.get("as_of")
    regime = data.get("regime") or {}
    lines = [
        "# AG INVEST | ASSET SCREEN DECISION BRIEF",
        f"Data per: {as_of or 'OKÄNT'} | Genererad: {data.get('generated_at') or 'OKÄNT'}",
        "OBS: Underliggande aktier, INTE mini futures/warranter. Inga automatiska entries.",
        f"MARKNADSREGIM: {regime.get('label') or 'EJ VERIFIERAD'} | "
        f"OMXS30: {regime.get('omxs30') or 'saknas'} | "
        f"RSI: {regime.get('rsi') or 'saknas'}",
        "STATUS betyder endast datakvalitet/bevakning, ALDRIG köpsignal.",
        "",
    ]
    candidates = data.get("candidates") or []
    for i, c in enumerate(candidates, 1):
        status, flags, rr = evaluate(c, as_of, today)
        name = c.get("name") or c.get("ticker") or "OKÄND"
        lines += [
            f"{i}. {name} | {str(c.get('side') or '?').upper()} | "
            f"{c.get('category') or 'UNCLASSIFIED'} | {status}",
            f"   Pris {c.get('price', 'saknas')} ({c.get('price_date') or as_of or 'okänt'}) "
            f"| RS3m {c.get('rs3m', 'saknas')} | RSI {c.get('rsi', 'saknas')} "
            f"| vol {c.get('volume_ratio', 'saknas')}x",
            f"   Indikativ plan: stop {c.get('stop', 'saknas')} | mål {c.get('target', 'saknas')} "
            f"| R/R {rr if rr is not None else 'EJ BERÄKNINGSBAR'}",
            f"   TES: {c.get('thesis') or 'SAKNAS – kräver manuell analys'}",
            f"   MOTBEVIS: {c.get('invalidation') or 'SAKNAS – kräver manuell analys'}",
            f"   RAPPORT: {c.get('earnings_date') or 'EJ VERIFIERAD'} "
            f"| KÄLLA: {c.get('source') or 'SAKNAS'}",
            f"   SPÄRRAR/VARNINGAR: {', '.join(flags) if flags else 'inga dataspärrar'}",
            "",
        ]
    if not candidates:
        lines.append("INGA KANDIDATER – NO TRADE.")
    lines += [
        "STYRELSE: NO TRADE utan aktuell kurs, verifierad katalysator, "
        "produktvillkor, spread, knockoutavstånd och dokumenterad risk.",
        "Risk: högst 4 % planerad förlustrisk/position; rapporttrades högst 4x hävstång.",
        "Score är INTE sannolikhet eller bevisad edge. Logga även bortvalda kandidater.",
    ]
    return "\n".join(lines)

def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python -m tools.asset_screen_brief candidates.json")
    data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    print(render(data))

if __name__ == "__main__":
    main()
