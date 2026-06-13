// Loading placeholders that mirror the real results layout, so the page keeps
// its shape while the (possibly cold) backend wakes and responds.

function Bar({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

export function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card p-4">
          <Bar className="h-2.5 w-16" />
          <Bar className="mt-2.5 h-6 w-12" />
        </div>
      ))}
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="relative h-[420px] overflow-hidden rounded-xl border border-line bg-panel">
      <div className="skeleton absolute inset-0 rounded-none opacity-70" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-line-strong border-t-amber" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-fg-muted">
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
    <div className="card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
        <div className="space-y-1.5">
          <Bar className="h-2.5 w-44" />
          <Bar className="h-4 w-40" />
          <Bar className="h-2 w-52" />
        </div>
        <Bar className="h-7 w-28" />
      </div>
      {/* Grid body */}
      <div className="space-y-px overflow-hidden rounded border border-line">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-full"
            style={{ background: i % 2 ? "#f7f9fb" : "#ffffff" }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
        <Bar className="h-5" />
        <Bar className="h-5" />
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
