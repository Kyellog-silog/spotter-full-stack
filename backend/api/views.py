"""POST /api/plan-trip/ — the single endpoint. Orchestrates geocoding,
routing, the HOS simulation, and the log-sheet builder into the one
JSON response the frontend renders from (contract in the root TODO.md).
"""

import requests
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from hos.logsheets import build_log_sheets
from hos.simulator import plan_trip
from routing.geocode import GeocodeError, geocode, reverse_geocode
from routing.route import RouteError, fetch_route, point_at_miles

from .serializers import PlanTripRequestSerializer

STOP_TITLES = {
    "pickup": "Pickup",
    "dropoff": "Drop-off",
    "fuel": "Fuel",
    "break_30m": "30-min break",
    "rest_10h": "10-hour rest",
    "restart_34h": "34-hour restart",
}


@api_view(["POST"])
def plan_trip_view(request):
    serializer = PlanTripRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        current = geocode(data["current_location"].strip())
        pickup = geocode(data["pickup_location"].strip())
        dropoff = geocode(data["dropoff_location"].strip())
    except GeocodeError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except requests.RequestException:
        return Response(
            {"detail": "The geocoding service is unavailable. Try again shortly."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    try:
        route = fetch_route(
            (
                (current["lat"], current["lng"]),
                (pickup["lat"], pickup["lng"]),
                (dropoff["lat"], dropoff["lng"]),
            )
        )
    except RouteError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except requests.RequestException:
        return Response(
            {"detail": "The routing service is unavailable. Try again shortly."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    legs = [
        {
            "from": current["label"],
            "to": pickup["label"],
            "miles": route["legs"][0]["miles"],
            "hours": route["legs"][0]["hours"],
        },
        {
            "from": pickup["label"],
            "to": dropoff["label"],
            "miles": route["legs"][1]["miles"],
            "hours": route["legs"][1]["hours"],
        },
    ]

    sim, summary = plan_trip(legs, data["current_cycle_used"])

    # Resolve each stop to a coordinate along the polyline plus a place name.
    stops_out = []
    place_by_time = {}
    for stop in sim.stops:
        point = point_at_miles(route["geometry"], route["cum_miles"], stop.trip_miles)
        place = stop.label or reverse_geocode(round(point[0], 3), round(point[1], 3))
        if not place:
            place = f"mile {round(stop.trip_miles)} en route"
        place_by_time[stop.time] = place
        stops_out.append(
            {
                "type": stop.type,
                "lat": round(point[0], 5),
                "lng": round(point[1], 5),
                "label": f"{STOP_TITLES.get(stop.type, stop.type)} — {place}",
                "time": stop.time.isoformat(timespec="minutes"),
            }
        )

    # Backfill resolved places into the pause/fuel segments that started at
    # those moments, so log-sheet remarks name where each change happened.
    for seg in sim.segments:
        if not seg.location and seg.start in place_by_time:
            seg.location = place_by_time[seg.start]

    sheets = build_log_sheets(sim.segments)

    return Response(
        {
            "summary": summary,
            "points": {
                "current": current,
                "pickup": pickup,
                "dropoff": dropoff,
            },
            "route": {
                "geometry": route["geometry"],
                "legs": [
                    {
                        "from": l["from"],
                        "to": l["to"],
                        "miles": l["miles"],
                        "drive_hours": l["hours"],
                    }
                    for l in legs
                ],
            },
            "stops": stops_out,
            "segments": [
                {
                    "status": s.status,
                    "start": s.start.isoformat(timespec="minutes"),
                    "end": s.end.isoformat(timespec="minutes"),
                    "duration_hours": round(s.duration_hours, 2),
                    "location": s.location,
                    "note": s.note,
                }
                for s in sim.segments
            ],
            "log_sheets": sheets,
        }
    )
