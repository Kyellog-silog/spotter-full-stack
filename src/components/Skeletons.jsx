// Loading placeholders that mirror the real results layout, so the page keeps
// its shape while the (possibly cold) backend wakes and responds.

function Bar({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

export function SummarySkeleton() {
  return (
    <div className="card p-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-ink-700 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-ink-800 p-3">
            <Bar className="h-2.5 w-16" />
            <Bar className="mt-2.5 h-6 w-12" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Bar className="h-3 w-40" />
        <Bar className="h-3 w-20" />
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="relative h-[420px] overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
      <div className="skeleton absolute inset-0 rounded-none opacity-60" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink-600 border-t-signal" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">
          Plotting route
        </span>
      </div>
    </div>
  );
}

export function ItinerarySkeleton() {
  return (
    <div className="card mt-4 p-4">
      <Bar className="mb-3 h-2.5 w-24" />
      <div className="mb-4 space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Bar key={i} className="h-3.5 w-full" />
        ))}
      </div>
      <Bar className="mb-3 h-2.5 w-28" />
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Bar className="h-2.5 w-2.5 rounded-full" />
            <Bar className="h-3 flex-1" />
            <Bar className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LogSheetSkeleton() {
  return (
    <div className="rounded-xl border border-paper-edge bg-paper p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-center justify-between border-b border-paper-line pb-3">
        <div className="space-y-1.5">
          <div className="h-2.5 w-44 rounded bg-paper-line/70" />
          <div className="h-4 w-40 rounded bg-paper-line" />
          <div className="h-2 w-52 rounded bg-paper-line/60" />
        </div>
        <div className="h-7 w-28 rounded bg-paper-line/60" />
      </div>
      {/* Grid body */}
      <div className="space-y-px overflow-hidden rounded border border-paper-line/70">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-full"
            style={{ background: i % 2 ? "#F6F1E4" : "#FBF8F0" }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-paper-line pt-3">
        <div className="h-5 rounded bg-paper-line/50" />
        <div className="h-5 rounded bg-paper-line/50" />
      </div>
    </div>
  );
}

export default function ResultsSkeleton() {
  return (
    <div className="space-y-5">
      <SummarySkeleton />
      <div>
        <Bar className="mb-2.5 h-3 w-20" />
        <MapSkeleton />
        <ItinerarySkeleton />
      </div>
      <div>
        <Bar className="mb-2.5 h-3 w-36" />
        <div className="space-y-4">
          <LogSheetSkeleton />
          <LogSheetSkeleton />
        </div>
      </div>
    </div>
  );
}
