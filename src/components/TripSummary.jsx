const STATS = [
  { key: "total_miles", label: "Total miles", fmt: (v) => v.toLocaleString() },
  { key: "total_drive_hours", label: "Drive hours", fmt: (v) => v },
  { key: "num_days", label: "Log days", fmt: (v) => v },
  { key: "num_fuel_stops", label: "Fuel stops", fmt: (v) => v },
  { key: "num_rests", label: "Rests", fmt: (v) => v },
];

export default function TripSummary({ summary }) {
  const cyclePct = Math.min(100, (summary.cycle_used_end / 70) * 100);
  const cycleHot = summary.cycle_used_end >= 60;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* lead stat in navy, like the design */}
        <div className="flex flex-col justify-between rounded-xl bg-navy p-4 text-surface shadow-card">
          <div className="font-mono text-[10px] uppercase tracking-wider text-navy-200">
            {STATS[0].label}
          </div>
          <div className="mt-2 font-mono text-2xl font-700 leading-none">
            {STATS[0].fmt(summary[STATS[0].key])}
          </div>
        </div>
        {STATS.slice(1).map((s) => (
          <div key={s.key} className="card p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-fg-faint">
              {s.label}
            </div>
            <div className="mt-2 font-mono text-2xl font-700 leading-none text-fg">
              {s.fmt(summary[s.key])}
            </div>
          </div>
        ))}
      </div>

      {/* 70-hour cycle meter */}
      <div className="card mt-3 p-4">
        <div className="mb-1.5 flex items-center justify-between font-mono text-xs text-fg-muted">
          <span>
            Cycle used: {summary.cycle_used_start}h
            <span className="text-amber-dark"> &rarr; </span>
            <span className="font-700 text-navy">{summary.cycle_used_end}h</span> / 70h
          </span>
          <span>Trip span: {summary.total_duration_hours}h</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-line">
          <div
            className={`h-full rounded-full transition-all ${cycleHot ? "bg-amber" : "bg-good"}`}
            style={{ width: `${cyclePct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
