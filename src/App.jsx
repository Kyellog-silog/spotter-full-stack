import { useEffect, useState } from "react";
import { planTrip, pingBackend, NEEDS_WARMUP } from "./api/client.js";
import TripForm from "./components/TripForm.jsx";
import RouteMap from "./components/RouteMap.jsx";
import TripSummary from "./components/TripSummary.jsx";
import Itinerary from "./components/Itinerary.jsx";
import LogSheet from "./components/LogSheet.jsx";
import ResultsSkeleton from "./components/Skeletons.jsx";
import { STOP_META } from "./lib/status.js";

export default function App() {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");
  // backend wake state: "ready" (mock/local) | "warming" | "online"
  const [backend, setBackend] = useState(NEEDS_WARMUP ? "warming" : "ready");

  // Warm the (sleeping) Render backend as soon as the app loads, so by the
  // time the user submits, the dyno is already up.
  useEffect(() => {
    if (!NEEDS_WARMUP) return;
    const controller = new AbortController();
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 24 && !cancelled; i++) {
        const ok = await pingBackend(controller.signal);
        if (ok) {
          if (!cancelled) setBackend("online");
          return;
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  async function handleSubmit(input) {
    setStatus("loading");
    setError("");
    try {
      const result = await planTrip(input);
      setTrip(result);
      setStatus("done");
      setBackend((b) => (b === "warming" ? "online" : b));
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="chrome-grain min-h-screen">
      <Header backend={backend} />

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[340px_1fr] lg:px-6">
        {/* Sidebar: form */}
        <aside className="no-print lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <h2 className="mb-1 font-display text-sm font-700 uppercase tracking-wide text-navy">
              Trip details
            </h2>
            <p className="mb-4 font-mono text-[11px] text-fg-muted">
              Property-carrying &middot; 70h / 8 days
            </p>
            <TripForm onSubmit={handleSubmit} loading={status === "loading"} />
          </div>
          <MapLegend />
        </aside>

        {/* Results */}
        <section className="min-w-0">
          {status === "idle" && <EmptyState />}
          {status === "loading" && <LoadingState backend={backend} />}
          {status === "error" && <ErrorState message={error} />}
          {status === "done" && trip && <Results trip={trip} />}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Header({ backend }) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-xl font-800 tracking-tight text-navy">
              MILEPOST
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-amber-dark sm:inline">
              HOS Planner
            </span>
          </div>
        </div>
        <BackendBadge backend={backend} />
      </div>
    </header>
  );
}

function Logo() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber text-navy shadow-glow">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 17h2m14 0h2M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M3 17V7a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v10m0-7h3.2a1 1 0 0 1 .8.4l2 2.6a1 1 0 0 1 .2.6V17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function BackendBadge({ backend }) {
  const map = {
    ready: { dot: "bg-navy", text: "Demo data", pulse: false },
    warming: { dot: "bg-amber", text: "Waking server", pulse: true },
    online: { dot: "bg-good", text: "Server online", pulse: false },
  };
  const s = map[backend] || map.ready;
  return (
    <span className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5">
      <span className="relative flex h-2 w-2">
        {s.pulse && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.dot} opacity-60`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`} />
      </span>
      <span className="font-mono text-[11px] uppercase tracking-wider text-fg-muted">
        {s.text}
      </span>
    </span>
  );
}

function Results({ trip }) {
  return (
    <div className="space-y-5">
      <TripSummary summary={trip.summary} />

      <div className="no-print">
        <SectionTitle>Route &amp; stops</SectionTitle>
        <RouteMap trip={trip} />
        <Itinerary trip={trip} />
      </div>

      <div className="print-area">
        <div className="flex items-center justify-between">
          <SectionTitle>Daily log sheets</SectionTitle>
          <button
            onClick={() => window.print()}
            className="no-print rounded-lg border border-line-strong bg-surface px-3 py-1.5 font-mono
                       text-xs uppercase tracking-wider text-fg-soft transition
                       hover:border-navy hover:text-navy"
          >
            Print / PDF
          </button>
        </div>
        <div className="space-y-4">
          {trip.log_sheets.map((sheet, i) => (
            <LogSheet key={sheet.date} sheet={sheet} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="mb-2.5 flex items-center gap-2 font-display text-xs font-700 uppercase tracking-[0.16em] text-fg-muted">
      <span className="h-3 w-1 rounded-full bg-amber" />
      {children}
    </h2>
  );
}

function MapLegend() {
  const items = [
    ["pickup", "Start / Pickup"],
    ["fuel", "Fuel stop"],
    ["break_30m", "30-min break"],
    ["rest_10h", "10-hour reset"],
    ["restart_34h", "34-hour restart"],
    ["dropoff", "Drop-off"],
  ];
  return (
    <div className="card mt-4 p-4">
      <div className="field-label mb-2.5">Map markers</div>
      <ul className="space-y-2">
        {items.map(([key, label]) => (
          <li key={key} className="flex items-center gap-2.5">
            <span
              className="inline-block h-3 w-3 rounded-full ring-2 ring-surface"
              style={{ background: STOP_META[key].color }}
            />
            <span className="font-mono text-xs text-fg-soft">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[440px] flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface/60 p-8 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-soft text-amber-dark">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      </div>
      <div className="font-display text-lg font-700 text-navy">
        Enter a trip to plan the route
      </div>
      <p className="mt-2 max-w-sm font-body text-sm text-fg-muted">
        Add the current, pickup, and drop-off locations plus hours already used in
        the 70-hour cycle. You will get a mapped route and a daily log sheet for each
        day of the trip.
      </p>
    </div>
  );
}

function LoadingState({ backend }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const cold = backend === "warming" || elapsed >= 4;
  return (
    <div className="space-y-4">
      {cold && (
        <div className="flex items-start gap-3 rounded-xl border border-amber/40 bg-amber-soft px-4 py-3">
          <span className="mt-0.5 h-4 w-4 flex-none animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
          <div>
            <div className="font-display text-sm font-700 text-amber-dark">
              Waking the server
            </div>
            <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-fg-muted">
              The backend sleeps when idle on free hosting and can take up to ~50s to
              wake on the first request. The page fills in automatically &mdash; no need
              to resubmit.
            </p>
          </div>
        </div>
      )}
      <ResultsSkeleton />
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="rounded-xl border border-stop-restart/40 bg-surface p-6 shadow-card">
      <div className="font-display text-sm font-700 uppercase tracking-wide text-stop-restart">
        Could not plan the trip
      </div>
      <p className="mt-2 font-mono text-xs text-fg-muted">{message}</p>
      <p className="mt-2 font-body text-sm text-fg-soft">
        Check the locations and try again. If the server was asleep, a second attempt
        usually goes through.
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="no-print border-t border-line px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-fg-faint">
          Milepost &middot; HOS trip planner &amp; ELD log generator
        </span>
        <span className="font-mono text-[11px] text-fg-faint">
          Routing: OSRM &middot; Geocoding: Nominatim + Photon &middot; Tiles: OpenStreetMap
        </span>
      </div>
    </footer>
  );
}
