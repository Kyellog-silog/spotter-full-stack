"""Nominatim (OpenStreetMap) geocoding. Free, no key; requires a real
User-Agent and light request volume, so results are cached in-process.
"""

from functools import lru_cache

import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
HEADERS = {"User-Agent": "milepost-eld-trip-planner/1.0 (assessment project)"}
TIMEOUT = 8


class GeocodeError(Exception):
    pass


@lru_cache(maxsize=512)
def geocode(query: str):
    """Return {"label", "lat", "lng"} for a free-text place query."""
    resp = requests.get(
        NOMINATIM_URL,
        params={"q": query, "format": "jsonv2", "limit": 1, "addressdetails": 1},
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    results = resp.json()
    if not results:
        raise GeocodeError(f'Could not find a place matching "{query}".')
    hit = results[0]
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
