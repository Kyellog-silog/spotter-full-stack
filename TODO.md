# Milepost — HOS Trip Planner & ELD Log Generator

Full-stack assessment: take trip inputs, output a route map plus filled-out
FMCSA daily log sheets (ELD style) for property-carrying drivers.

Stack: Django + DRF (backend), React + Vite (frontend). Deploy: Vercel (frontend),
Railway (backend).

---

## Deliverables (from the brief)

- [ ] Live hosted version (frontend on Vercel, backend on Railway)
- [ ] 3 to 5 minute Loom walking through the app and the code
- [ ] GitHub repo (frontend + backend)
- [ ] Accuracy of output must hold up to review
- [ ] Strong UI/UX (explicitly graded, can offset minor output inaccuracies)

## Inputs / Outputs

Inputs: current location, pickup location, dropoff location, current cycle used (hrs).

Outputs:
- Map of the route with markers for stops and rests (free map API)
- Daily log sheets drawn on the 24-hour grid, one per calendar day

## Fixed assumptions (from the brief)

- Property-carrying driver, 70 hours / 8 days, no adverse driving conditions
- Fueling at least once every 1,000 miles
- 1 hour on duty for pickup, 1 hour on duty for drop-off

---

## HOS rules to implement (from the FMCSA driver guide)

Four clocks tracked at once:

1. 11-hour driving limit. Max 11 h driving per window. At 11, need a 10-hour reset.
2. 14-hour window. Starts at first on-duty after 10 h off, runs on wall clock.
   No driving past hour 14. Non-driving work past 14 is allowed and still counts
   toward the 70-hour cycle.
3. 30-minute break. Required after 8 cumulative driving hours. Satisfied by any
   30 consecutive non-driving minutes (a fuel stop or pickup hour covers it).
4. 70-hour / 8-day cycle. Total on-duty time (driving + on-duty not driving).
   Seeded by the "current cycle used" input. At 70, no driving until a 34-hour restart.

Resets:
- 10 consecutive hours off (Off Duty or Sleeper) restarts clocks 1, 2, 3. Not the cycle.
- 34 consecutive hours off resets the 70-hour cycle to zero.

Duty statuses (the four grid rows): Off Duty, Sleeper Berth, Driving, On Duty (Not Driving).
Fueling, inspection, loading, pickup, and drop-off are all On Duty (Not Driving).

Starting assumption to state in the README/Loom: driver begins with daily clocks
fresh (just had 10 h off), with the 70-hour cycle seeded at the input value.

## What to ignore (simplified by the brief)

Short-haul exceptions, adverse driving, agricultural / Alaska / Hawaii / oilfield
exceptions, personal conveyance, yard moves. Sleeper-berth split (7+3, 7+2) is the
one hard optional piece. Build straight 10-hour resets first, add splits only as a bonus.

---

## Architecture

Backend owns all logic and returns drawing-ready data. Frontend only renders.

```
Frontend (React/Vite, Vercel)
  TripForm  ->  POST /api/plan-trip/  ->  Backend (Django/DRF, Railway)
                                            geocode (Nominatim)
                                            route   (OpenRouteService + OSRM fallback)
                                            HOS engine (pure Python)
                                            log-sheet builder
  RouteMap, TripSummary, LogSheet  <-  one JSON response
```

---

## Backend tasks

### HOS engine (`hos/`, pure Python, no Django imports)
- [x] `constants.py`: 11, 14, 8, 70, 10, 34, fuel interval 1000 mi, pickup/drop 1 h
- [x] the four counters live inside `simulator.py` (no separate clocks.py needed)
- [x] `segments.py`: Segment dataclass (status, start, end, duration, location, note)
- [x] `simulator.py`: walk the activity list, insert breaks / 10-h resets / 34-h restart
- [x] Golden test: John Doe (Richmond VA -> Newark NJ, 350 mi). Totals must be
      Off 10, Sleeper 1.75, Driving 7.75, On Duty 4.5, sum 24.
- [x] Multi-day fixtures (a trip that needs at least one 10-h reset across midnight)
- [x] A near-70-hour fixture that forces a 34-h restart

### Routing (`routing/`)
- [x] `geocode.py`: Nominatim with a real User-Agent header and caching
- [x] `route.py`: OSRM public server primary (no key), OpenRouteService truck
      profile when ORS_API_KEY is set; returns geometry, miles, drive hours per leg
- [x] Cache geocode + route results (lru_cache)

### Log sheets (`logsheets.py`)
- [x] Slice segments at midnight (home-terminal time), one sheet per day
- [x] Per-status totals (must sum to 24), total miles per day, remarks list

### API (`api/`)
- [x] `POST /api/plan-trip/` returns the contract below
- [ ] `GET /api/geocode/?q=` thin Nominatim proxy for autocomplete (optional)
- [x] Serializers: bound cycle 0..70, length-limit location strings
- [x] DRF throttling per IP
- [x] django-cors-headers locked to the Vercel origin (CORS_ALLOWED_ORIGINS env)
- [x] ORS key in env var; DEBUG=False; ALLOWED_HOSTS set for prod

### Deploy (Railway)
- [x] gunicorn + whitenoise + Procfile + railway.json written; set env vars at deploy time

Libraries: django, djangorestframework, django-cors-headers, requests, django-environ,
gunicorn, whitenoise. Add dj-database-url + psycopg only if persisting trips.

---

## Frontend tasks

See the `eld-frontend/` scaffold. Runs standalone on mock data until the backend exists.

- [x] Vite + React + Tailwind set up with the Milepost token system
- [x] TripForm (four inputs, validation, load-example)
- [x] RouteMap (react-leaflet, OSM tiles, route polyline, stop markers)
- [x] TripSummary (miles, drive time, days, fuel stops, rests, cycle used)
- [x] LogSheet (SVG 24-hour grid, duty line, per-status totals, remarks)
- [x] Mock trip response matching the contract
- [x] Loading / error / empty states
- [x] Print logs (window.print with print-only CSS)
- [x] Swap mock client for real `POST /api/plan-trip/` (VITE_USE_MOCK=true for offline demo)
- [ ] Address autocomplete against `GET /api/geocode/` (optional)

### UX polish (requested)
- [x] RouteMap: enable scroll-wheel zoom
- [x] LogSheet: click a sheet to enlarge it (zoomable modal: scroll / -+ buttons / keyboard,
      Esc to close) so the user can zoom in/out on the 24-hour grid
- [x] LogSheet: "Projected log — generated from HOS rules" label on each sheet header

Libraries: react, react-dom, react-leaflet, leaflet, react-hook-form, tailwindcss.
Optional: @tanstack/react-query, jsPDF + html2canvas for a real PDF download.

---

## API contract (the seam)

`POST /api/plan-trip/`

Request:
```json
{
  "current_location": "Dallas, TX",
  "pickup_location": "Oklahoma City, OK",
  "dropoff_location": "Denver, CO",
  "current_cycle_used": 10
}
```

Response:
```json
{
  "summary": {
    "total_miles": 0, "total_drive_hours": 0, "total_duration_hours": 0,
    "num_days": 0, "num_fuel_stops": 0, "num_rests": 0,
    "cycle_used_start": 0, "cycle_used_end": 0
  },
  "points": {
    "current": { "label": "", "lat": 0, "lng": 0 },
    "pickup":  { "label": "", "lat": 0, "lng": 0 },
    "dropoff": { "label": "", "lat": 0, "lng": 0 }
  },
  "route": {
    "geometry": [[lat, lng]],
    "legs": [{ "from": "", "to": "", "miles": 0, "drive_hours": 0 }]
  },
  "stops": [
    { "type": "fuel|pickup|dropoff|break_30m|rest_10h|restart_34h",
      "lat": 0, "lng": 0, "label": "", "time": "ISO" }
  ],
  "segments": [
    { "status": "off_duty|sleeper|driving|on_duty",
      "start": "ISO", "end": "ISO", "duration_hours": 0, "location": "", "note": "" }
  ],
  "log_sheets": [
    { "date": "YYYY-MM-DD", "total_miles": 0,
      "totals": { "off_duty": 0, "sleeper": 0, "driving": 0, "on_duty": 0 },
      "segments": [
        { "status": "", "start": "HH:MM", "end": "HH:MM", "location": "", "note": "" }
      ],
      "remarks": [ { "time": "HH:MM", "location": "" } ] }
  ]
}
```

Note: top-level `segments` use ISO datetimes. Inside `log_sheets[].segments`, times are
`HH:MM` within that day (use `24:00` for an end-of-day boundary) so the renderer stays trivial.

---

## Golden test (validate the renderer and engine)

FMCSA guide pages 18 to 19, John Doe, Richmond VA to Newark NJ, 350 miles:
Off Duty 10, Sleeper 1.75, Driving 7.75, On Duty 4.5, total 24. Encode as a fixture
on both sides. Great 20-second beat for the Loom.

## Loom outline (3 to 5 min)

1. Enter a multi-day trip, show the route map and stop markers
2. Scroll the daily log sheets, point out the duty line, totals summing to 24, remarks
3. Show the John Doe golden test passing
4. 30 seconds on the engine: the four clocks and where resets get inserted
5. Mention the free APIs (Nominatim + OpenRouteService/OSRM) and that keys stay server-side
