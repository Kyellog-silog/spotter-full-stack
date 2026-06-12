import { STOP_META } from "../lib/status.js";

function formatTime(iso) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function Itinerary({ trip }) {
  const { legs } = trip.route;
  const stops = trip.stops;

  return (
    <div className="card mt-4 p-4">
      {/* Legs: the driving instructions */}
      <div className="field-label mb-2">Route legs</div>
      <ul className="mb-4 space-y-1.5">
        {legs.map((leg, i) => (
          <li
            key={i}
            className="flex flex-wrap items-baseline gap-x-2 font-mono text-xs text-paper"
          >
            <span className="text-ink-500">{i + 1}.</span>
            <span>{leg.from}</span>
            <span className="text-signal">&rarr;</span>
            <span>{leg.to}</span>
            <span className="ml-auto text-ink-500">
              {Math.round(leg.miles).toLocaleString()} mi &middot; {leg.drive_hours} h
            </span>
          </li>
        ))}
      </ul>

      {/* Chronological stops and rests */}
      <div className="field-label mb-2">Stops &amp; rests</div>
      <ol className="space-y-2">
        {stops.map((s, i) => {
          const meta = STOP_META[s.type] || { color: "#888" };
          return (
            <li key={i} className="flex items-center gap-2.5">
              <span
                className="inline-block h-2.5 w-2.5 flex-none rounded-full border border-ink"
                style={{ background: meta.color }}
              />
              <span className="min-w-0 flex-1 truncate font-body text-sm text-paper">
                {s.label}
              </span>
              <span className="flex-none font-mono text-[11px] text-ink-500">
                {formatTime(s.time)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
