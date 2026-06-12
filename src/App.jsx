import { useState } from "react";
import { planTrip } from "./api/client.js";
import TripForm from "./components/TripForm.jsx";
import RouteMap from "./components/RouteMap.jsx";
import TripSummary from "./components/TripSummary.jsx";
import Itinerary from "./components/Itinerary.jsx";
import LogSheet from "./components/LogSheet.jsx";
import { STOP_META } from "./lib/status.js";

export default function App() {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(input) {
    setStatus("loading");
    setError("");
    try {
      const result = await planTrip(input);
      setTrip(result);
      setStatus("done");
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="chrome-grain min-h-screen">
      <Header />

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[340px_1fr] lg:px-6">
        {/* Sidebar: form */}
        <aside className="no-print lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-ink-700 bg-ink-800 p-5">
            <h2 className="mb-1 font-display text-sm font-700 uppercase tracking-wide text-paper">
              Trip details
            </h2>
            <p className="mb-4 font-mono text-[11px] text-ink-500">
              Property-carrying &middot; 70h / 8 days
            </p>
            <TripForm onSubmit={handleSubmit} loading={status === "loading"} />
          </div>
          <MapLegend />
        </aside>

        {/* Results */}
        <section className="min-w-0">
          {status === "idle" && <EmptyState />}
          {status === "loading" && <LoadingState />}
          {status === "error" && <ErrorState message={error} />}
          {status === "done" && trip && <Results trip={trip} />}
        </section>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="no-print border-b border-ink-700 bg-ink-800/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 lg:px-6">
        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-xl font-800 tracking-tight text-paper">
            MILEPOST
          </span>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-signal sm:inline">
            HOS Trip Planner
          </span>
        </div>
        <span className="font-mono text-[11px] text-ink-500">
          Route &middot; ELD daily logs
        </span>
      </div>
    </header>
  );
}

function Results({ trip }) {
  return (
    <div className="space-y-5">
      <TripSummary summary={trip.summary} />

      <div className="no-print">
        <SectionTitle>Route</SectionTitle>
        <RouteMap trip={trip} />
        <Itinerary trip={trip} />
      </div>

      <div className="print-area">
        <div className="flex items-center justify-between">
          <SectionTitle>Daily log sheets</SectionTitle>
          <button
            onClick={() => window.print()}
            className="no-print rounded-md border border-ink-600 px-3 py-1.5 font-mono
                       text-xs uppercase tracking-wider text-ink-500 transition hover:text-paper"
          >
            Print logs
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
    <h2 className="mb-2.5 font-display text-xs font-700 uppercase tracking-[0.18em] text-ink-500">
      {children}
    </h2>
  );
}

function MapLegend() {
  const items = [
    ["pickup", "Start / Pickup"],
    ["fuel", "Fuel stop"],
    ["rest_10h", "10-hour reset"],
    ["dropoff", "Drop-off"],
  ];
  return (
    <div className="mt-4 rounded-lg border border-ink-700 bg-ink-800 p-4">
      <div className="field-label mb-2.5">Map markers</div>
      <ul className="space-y-2">
        {items.map(([key, label]) => (
          <li key={key} className="flex items-center gap-2.5">
            <span
              className="inline-block h-3 w-3 rounded-full border border-ink"
              style={{ background: STOP_META[key].color }}
            />
            <span className="font-mono text-xs text-paper">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-ink-700 bg-ink-800/40 p-8 text-center">
      <div className="font-display text-lg font-700 text-paper">
        Enter a trip to plan the route
      </div>
      <p className="mt-2 max-w-sm font-body text-sm text-ink-500">
        Add the current, pickup, and drop-off locations plus hours already used in
        the 70-hour cycle. You will get a mapped route and a daily log sheet for each
        day of the trip.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-lg border border-ink-700 bg-ink-800/40 p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-signal" />
      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-ink-500">
        Plotting route and building logs
      </p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="rounded-lg border border-signal-dim bg-ink-800 p-6">
      <div className="font-display text-sm font-700 uppercase tracking-wide text-signal-bright">
        Could not plan the trip
      </div>
      <p className="mt-2 font-mono text-xs text-ink-500">{message}</p>
      <p className="mt-2 font-body text-sm text-paper">
        Check the locations and try again.
      </p>
    </div>
  );
}
