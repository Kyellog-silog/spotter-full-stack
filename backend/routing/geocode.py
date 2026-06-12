"""Nominatim (OpenStreetMap) geocoding. Free, no key; requires a real
User-Agent and light request volume, so results are cached in-process.

Nominatim's free-text search is fussy: a secondary unit ("Suite 270",
"Apt 4", "#270") or stray punctuation can make a perfectly valid address
return zero results. So we try the cleaned query first, then fall back to
progressively simpler forms (drop the unit, then drop the street line down
to "city, state ZIP") before giving up.
"""

import re
from functools import lru_cache

import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
HEADERS = {"User-Agent": "milepost-eld-trip-planner/1.0 (assessment project)"}
TIMEOUT = 8

# Secondary-unit designators that Nominatim chokes on inside a query.
_UNIT_RE = re.compile(
    r"^(suite|ste|unit|apt|apartment|fl|floor|bldg|building|rm|room|dept|department|#)\b",
    re.IGNORECASE,
)


class GeocodeError(Exception):
    pass


def _candidates(raw: str):
    """Most-specific-first list of query strings to try for one location."""
    q = raw.strip().strip(".").strip()
    cands = [q]

    parts = [p.strip() for p in q.split(",") if p.strip()]
    # Drop any secondary-unit segment (Suite 270, #4, Apt B, ...).
    no_unit = [p for p in parts if not _UNIT_RE.match(p) and not _UNIT_RE.match(p.lstrip("#"))]
    if no_unit and no_unit != parts:
        cands.append(", ".join(no_unit))

    base = no_unit or parts
    # Drop the street line (first segment) -> "city, state ZIP".
    if len(base) > 2:
        cands.append(", ".join(base[1:]))
    # Last resort: just the city/state, no ZIP.
    if len(base) >= 2:
        tail = base[1:] if len(base) > 2 else base
        # strip a trailing bare ZIP token from the final segment
        cleaned = [re.sub(r"\b\d{5}(-\d{4})?\b", "", t).strip(" ,") for t in tail]
        cleaned = [t for t in cleaned if t]
        if cleaned:
            cands.append(", ".join(cleaned))

    # de-dupe, preserve order
    seen, out = set(), []
    for c in cands:
        key = c.lower()
        if c and key not in seen:
            seen.add(key)
            out.append(c)
    return out


def _search(query: str):
    resp = requests.get(
        NOMINATIM_URL,
        params={"q": query, "format": "jsonv2", "limit": 1, "addressdetails": 1},
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    results = resp.json()
    return results[0] if results else None


@lru_cache(maxsize=512)
def geocode(query: str):
    """Return {"label", "lat", "lng"} for a free-text place or address query.

    Tries the cleaned query, then simpler fallbacks, before failing.
    """
    hit = None
    for candidate in _candidates(query):
        hit = _search(candidate)
        if hit:
            break
    if not hit:
        raise GeocodeError(f'Could not find a place matching "{query.strip()}".')

    addr = hit.get("address", {})
    city = (
        addr.get("city")
        or addr.get("town")
        or addr.get("village")
        or addr.get("county")
        or hit.get("name")
        or query
    )
    state = addr.get("state", "")
    label = f"{city}, {state}" if state else city
    return {"label": label, "lat": float(hit["lat"]), "lng": float(hit["lon"])}


@lru_cache(maxsize=512)
def reverse_geocode(lat: float, lng: float) -> str:
    """Best-effort city-level label for a coordinate; '' on any failure."""
    try:
        resp = requests.get(
            NOMINATIM_REVERSE_URL,
            params={"lat": lat, "lon": lng, "format": "jsonv2", "zoom": 10},
            headers=HEADERS,
            timeout=4,
        )
        resp.raise_for_status()
        addr = resp.json().get("address", {})
        city = (
            addr.get("city")
            or addr.get("town")
            or addr.get("village")
            or addr.get("county")
            or ""
        )
        state = addr.get("state", "")
        if city and state:
            return f"{city}, {state}"
        return city or state
    except Exception:
        return ""
