# Milepost — HOS Trip Planner & ELD Log Generator

Full-stack assessment app. Takes trip details (current location, pickup,
drop-off, current cycle hours used) and returns route instructions on a map
plus FMCSA Driver's Daily Log sheets drawn for every day of the trip.

- **Frontend:** React + Vite + Tailwind (repo root) — deployed on Vercel
- **Backend:** Django + DRF (`backend/`) — deployed on Railway
- **Free APIs:** Nominatim (geocoding) + OSRM (routing); no keys required.
  Keys never reach the browser — all third-party calls happen server-side.

## How it works

```
TripForm  ->  POST /api/plan-trip/  ->  geocode (Nominatim)
                                        route   (OSRM, ORS optional)
                                        HOS engine (pure Python)
                                        log-sheet builder
RouteMap, TripSummary, LogSheet  <-  one JSON response
```

The backend owns all logic and returns drawing-ready data; the frontend only
renders. The API contract is documented in `TODO.md`.

### HOS rules implemented (property-carrying, 70 hr / 8 days)

The simulator (`backend/hos/simulator.py`) tracks four clocks at once and
inserts the cheapest legal pause whenever one runs out:

| Clock | Limit | Reset |
|---|---|---|
| Driving | 11 h | 10 consecutive hours off/sleeper |
| Driving window | 14 h wall clock | 10 consecutive hours off/sleeper |
| Break | 30 min required after 8 h cumulative driving | any 30 non-driving minutes (fuel/pickup count) |
| Cycle | 70 h on-duty in 8 days | 34-hour restart |

Brief assumptions: fuel stop (30 min, on duty) at least every 1,000 miles;
1 hour on duty for pickup and for drop-off; no adverse driving conditions.
Stated starting assumption: the driver begins with fresh daily clocks (just
completed a 10-hour reset) at 08:00 home-terminal time, with the cycle seeded
at the "current cycle used" input.

### Accuracy checks

`backend/hos/tests.py` (12 tests) includes the golden fixture from the FMCSA
driver's guide pp. 18–19 (John Doe, Richmond VA → Newark NJ, 350 mi: Off 10,
Sleeper 1.75, Driving 7.75, On Duty 4.5 = 24 h exactly), plus property tests:
every generated sheet tiles 00:00–24:00 with totals summing to 24, no driving
stretch exceeds 11 h or the 14-h window, breaks land after exactly 8 h of
driving, fuel stops appear every 1,000 mi, and a near-70 cycle forces a
34-hour restart.

```bash
cd backend
python -m unittest hos.tests -v
```

## Run locally

Backend (Python 3.11+):

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate   # or source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver
```

Frontend (Node 18+):

```bash
npm install
npm run dev
```

Open the printed localhost URL, hit **Example**, then **Plan trip**. Vite
proxies `/api` to `http://127.0.0.1:8000` in dev (see `vite.config.js`), so no
CORS setup is needed locally. Set `VITE_USE_MOCK=true` to demo the UI with no
backend at all.

## Deploy

**Backend → Railway:** point the service at `backend/` (Procfile +
`railway.json` included). Set env vars from `backend/.env.example`:
`SECRET_KEY`, `DEBUG=false`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`
(the Vercel URL). Optional `ORS_API_KEY` switches routing to
OpenRouteService's truck profile; otherwise OSRM is used.

**Frontend → Vercel:** import the repo root (Vite preset). Set
`VITE_API_BASE` to the Railway URL.

## Design

- Chrome: diesel navy (`ink`), DOT signage amber accent (`signal`)
- Log sheets: paper cream with the blue grid of the real DOT form, drawn as
  SVG — duty line, per-status totals, grand total, remarks ticks
- Type: Archivo (display), Inter (body), JetBrains Mono (data/times)
- Print: `window.print()` with print-only CSS emits just the log sheets

## Structure

```
src/                  React app
  api/                client.js (fetch), mockTrip.js (offline demo data)
  lib/                status.js (duty/stop metadata, time helpers)
  components/         TripForm, RouteMap, TripSummary, LogSheet
backend/
  config/             Django settings/urls/wsgi (stateless: no DB, no admin)
  hos/                constants, segments, simulator, logsheets + tests
  routing/            geocode.py (Nominatim), route.py (OSRM/ORS)
  api/                POST /api/plan-trip/ (serializer, view, throttling)
resources/            assessment brief materials (FMCSA guide, blank log form)
```
