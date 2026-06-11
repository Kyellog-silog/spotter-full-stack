const STATS = [
  { key: "total_miles", label: "Total miles", fmt: (v) => v.toLocaleString() },
  { key: "total_drive_hours", label: "Drive hours", fmt: (v) => v },
  { key: "num_days", label: "Log days", fmt: (v) => v },
  { key: "num_fuel_stops", label: "Fuel stops", fmt: (v) => v },
  { key: "num_rests", label: "Rests", fmt: (v) => v },
];

export default function TripSummary({ summary }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800 p-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-ink-700 sm:grid-cols-3 lg:grid-cols-5">
        {STATS.map((s) => (
          <div key={s.key} className="bg-ink-800 p-3">
            <div className="field-label">{s.label}</div>
            <div className="mt-1 font-mono text-2xl font-700 text-paper">
              {s.fmt(summary[s.key])}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-xs text-ink-500">
        <span>
          Cycle used: {summary.cycle_used_start}h
          <span className="text-signal"> &rarr; </span>
          {summary.cycle_used_end}h / 70h
        </span>
        <span>Trip span: {summary.total_duration_hours}h</span>
      </div>
    </div>
  );
}
