"""Geocoding for free-text places and street addresses.

Primary provider is Nominatim (OpenStreetMap). The public Nominatim server
rate-limits cloud IPs hard (~1 req/sec), so when it returns nothing or errors
we transparently fall back to Photon (komoot's free OSM geocoder), which is
much more tolerant of hosted usage. Both are free and need no API key.

Nominatim's free-text search is also fussy about secondary units
("Suite 270", "Apt 4", "#270") and stray punctuation, so each location is
tried as the cleaned string first, then progressively simpler forms.
"""

import re
from functools import lru_cache

import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
PHOTON_URL = "https://photon.komoot.io/api/"
PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse"
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
    # Last resort: city/state without a trailing ZIP.
    if len(base) >= 2:
        tail = base[1:] if len(base) > 2 else base
        cleaned = [re.sub(r"\b\d{5}(-\d{4})?\b", "", t).strip(" ,") for t in tail]
        cleaned = [t for t in cleaned if t]
        if cleaned:
            cands.append(", ".join(cleaned))

    seen, out = set(), []
    for c in cands:
        key = c.lower()
        if c and key not in seen:
            seen.add(key)
            out.append(c)
    return out


def _from_nominatim(query):
    """Return a normalized hit dict from Nominatim, or None. Never raises."""
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": query, "format": "jsonv2", "limit": 1, "addressdetails": 1},
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        results = resp.json()
    except (requests.RequestException, ValueError):
        return None
    if not results:
        return None
    hit = results[0]
    addr = hit.get("address", {})
    city = (
        addr.get("city")
        or addr.get("town")
        or addr.get("village")
        or addr.get("county")
        or hit.get("name")
        or ""
    )
    return {"lat": float(hit["lat"]), "lng": float(hit["lon"]), "city": city, "state": addr.get("state", "")}


def _from_photon(query):
    """Return a normalized hit dict from Photon, or None. Never raises."""
    try:
        resp = requests.get(
            PHOTON_URL,
            params={"q": query, "limit": 1, "lang": "en"},
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        feats = resp.json().get("features", [])
    except (requests.RequestException, ValueError):
        return None
    if not feats:
        return None
    props = feats[0].get("properties", {})
    coords = feats[0].get("geometry", {}).get("coordinates", [])
    if len(coords) < 2:
        return None
    city = props.get("city") or props.get("name") or props.get("county") or ""
    return {"lat": float(coords[1]), "lng": float(coords[0]), "city": city, "state": props.get("state", "")}


def _resolve(query):
    """Try Nominatim, then Photon, for a single query string."""
    return _from_nominatim(query) or _from_photon(query)


@lru_cache(maxsize=512)
def geocode(query: str):
    """Return {"label", "lat", "lng"} for a free-text place or address query.

    Tries cleaned-then-simpler candidates, each against Nominatim then Photon.
    """
    hit = None
    for candidate in _candidates(query):
        hit = _resolve(candidate)
        if hit:
            break
    if not hit:
        raise GeocodeError(f'Could not find a place matching "{query.strip()}".')

    city = hit["city"] or query.strip()
    label = f"{city}, {hit['state']}" if hit["state"] else city
    return {"label": label, "lat": hit["lat"], "lng": hit["lng"]}


@lru_cache(maxsize=512)
def reverse_geocode(lat: float, lng: float) -> str:
    """Best-effort city-level label for a coordinate; '' on any failure."""
    # Nominatim first
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
        if city or state:
            return f"{city}, {state}" if city and state else (city or state)
    except (requests.RequestException, ValueError):
        pass

    # Photon fallback
    try:
        resp = requests.get(
            PHOTON_REVERSE_URL,
            params={"lat": lat, "lon": lng, "lang": "en"},
            headers=HEADERS,
            timeout=4,
        )
        resp.raise_for_status()
        feats = resp.json().get("features", [])
        if feats:
            props = feats[0].get("properties", {})
            city = props.get("city") or props.get("name") or props.get("county") or ""
            state = props.get("state", "")
            if city or state:
                return f"{city}, {state}" if city and state else (city or state)
    except (requests.RequestException, ValueError):
        pass

    return ""
