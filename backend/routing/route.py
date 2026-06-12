"""Road routing via the public OSRM demo server (free, no key), with
OpenRouteService as an optional alternative when ORS_API_KEY is set.

Returns the full route geometry as [lat, lng] pairs, per-leg miles and
drive hours, and a cumulative-distance table used to place fuel stops
and rests at the right point along the polyline.
"""

import math
import os
import time
from functools import lru_cache

import requests

OSRM_URL = "https://router.project-osrm.org/route/v1/driving/"
ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-hgv/geojson"
TIMEOUT = 20
METERS_PER_MILE = 1609.344

# Trucks average slower than the car profile OSRM assumes; never let the
# implied average speed exceed this.
MAX_AVG_MPH = 60.0


class RouteError(Exception):
    pass


def _truck_hours(miles: float, hours: float) -> float:
    return round(max(hours, miles / MAX_AVG_MPH), 2)


def _haversine_miles(a, b):
    lat1, lng1, lat2, lng2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = (
        math.sin((lat2 - lat1) / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    )
    return 3958.8 * 2 * math.asin(math.sqrt(h))


def _cumulative_miles(geometry):
    cum = [0.0]
    for i in range(1, len(geometry)):
        cum.append(cum[-1] + _haversine_miles(geometry[i - 1], geometry[i]))
    return cum


def point_at_miles(geometry, cum, miles):
    """Interpolate a [lat, lng] at `miles` along the polyline."""
    if not geometry:
        return None
    if miles <= 0:
        return geometry[0]
    if miles >= cum[-1]:
        return geometry[-1]
    # binary search for the surrounding vertex pair
    lo, hi = 0, len(cum) - 1
    while lo + 1 < hi:
        mid = (lo + hi) // 2
        if cum[mid] <= miles:
            lo = mid
        else:
            hi = mid
    span = cum[hi] - cum[lo]
    f = (miles - cum[lo]) / span if span > 0 else 0.0
    return [
        geometry[lo][0] + f * (geometry[hi][0] - geometry[lo][0]),
        geometry[lo][1] + f * (geometry[hi][1] - geometry[lo][1]),
    ]


@lru_cache(maxsize=128)
def fetch_route(coords_key):
    """coords_key: tuple of (lat, lng) waypoints, e.g. (current, pickup, dropoff).

    Returns {"geometry": [[lat,lng],...], "cum_miles": [...], "legs": [{"miles","hours"},...]}.
    """
    coords = list(coords_key)
    if os.environ.get("ORS_API_KEY"):
        try:
            return _fetch_ors(coords)
        except Exception:
            pass  # fall through to OSRM
    return _fetch_osrm(coords)


def _fetch_osrm(coords):
    path = ";".join(f"{lng},{lat}" for lat, lng in coords)
    # The public demo server drops the occasional request; retry once.
    for attempt in range(2):
        try:
            resp = requests.get(
                OSRM_URL + path,
                params={"overview": "full", "geometries": "geojson", "steps": "false"},
                timeout=TIMEOUT,
            )
            resp.raise_for_status()
            break
        except requests.RequestException:
            if attempt == 1:
                raise
            time.sleep(1.5)
    data = resp.json()
    if data.get("code") != "Ok" or not data.get("routes"):
        raise RouteError("No drivable route found between those locations.")
    route = data["routes"][0]
    geometry = [[lat, lng] for lng, lat in route["geometry"]["coordinates"]]
    legs = []
    for leg in route["legs"]:
        miles = leg["distance"] / METERS_PER_MILE
        legs.append(
            {"miles": round(miles, 1), "hours": _truck_hours(miles, leg["duration"] / 3600.0)}
        )
    return {"geometry": geometry, "cum_miles": _cumulative_miles(geometry), "legs": legs}


def _fetch_ors(coords):
    resp = requests.post(
        ORS_URL,
        json={"coordinates": [[lng, lat] for lat, lng in coords]},
        headers={"Authorization": os.environ["ORS_API_KEY"]},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    feature = resp.json()["features"][0]
    geometry = [[lat, lng] for lng, lat in feature["geometry"]["coordinates"]]
    legs = []
    for seg in feature["properties"]["segments"]:
        miles = seg["distance"] / METERS_PER_MILE
        legs.append(
            {"miles": round(miles, 1), "hours": _truck_hours(miles, seg["duration"] / 3600.0)}
        )
    return {"geometry": geometry, "cum_miles": _cumulative_miles(geometry), "legs": legs}
