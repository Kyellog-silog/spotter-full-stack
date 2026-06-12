import { useEffect, useState } from "react";
import { STATUS_ROWS, STATUS_META, hhmmToMinutes, formatHours } from "../lib/status.js";

// Grid geometry
const PAD_L = 104; // left status-label gutter
const PAD_R = 60; // right totals column
const PAD_T = 30; // top hour-label band
const GRID_W = 720;
const HOUR_W = GRID_W / 24;
const ROW_H = 34;
const GRID_H = ROW_H * 4;
const REMARKS_H = 104;
const W = PAD_L + GRID_W + PAD_R;
const H = PAD_T + GRID_H + REMARKS_H;

const minsToX = (m) => PAD_L + (m / 1440) * GRID_W;
const rowTop = (status) => PAD_T + STATUS_ROWS.indexOf(status) * ROW_H;
const rowMid = (status) => rowTop(status) + ROW_H / 2;

function hourLabel(h) {
  if (h === 0 || h === 24) return "Mid";
  if (h === 12) return "Noon";
  return String(h);
}

function buildDutyLine(segments) {
  const v = [];
  segments.forEach((seg, i) => {
    const x0 = minsToX(hhmmToMinutes(seg.start));
    const x1 = minsToX(hhmmToMinutes(seg.end));
    const y = rowMid(seg.status);
    if (i === 0) v.push([x0, y]);
    else v.push([x0, y]); // vertical transition at the shared boundary
    v.push([x1, y]);
  });
  return v.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function dateLabelFor(sheet) {
  return new Date(sheet.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// The drawn 24-hour grid as a standalone SVG. width="100%" so it scales to
// whatever box it sits in — the small card or the enlarged modal.
function LogGrid({ sheet, dateLabel }) {
  const totalAll =
    sheet.totals.off_duty +
    sheet.totals.sleeper +
    sheet.totals.driving +
    sheet.totals.on_duty;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className="select-none"
      role="img"
      aria-label={`Driver's daily log grid for ${dateLabel}`}
    >
      {/* Hour labels */}
      {Array.from({ length: 25 }, (_, h) => (
        <text
          key={`hl-${h}`}
          x={minsToX(h * 60)}
          y={PAD_T - 10}
          textAnchor="middle"
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
          fill="#5A5240"
        >
          {hourLabel(h)}
        </text>
      ))}

      {/* Row backgrounds + separators */}
      {STATUS_ROWS.map((status, i) => (
        <rect
          key={`rb-${status}`}
          x={PAD_L}
          y={PAD_T + i * ROW_H}
          width={GRID_W}
          height={ROW_H}
          fill={i % 2 === 0 ? "#FBF8F0" : "#F6F1E4"}
        />
      ))}

      {/* Quarter-hour ticks: rise up from the bottom line of each row,
          like the real DOT form (the 30-min center tick is the tallest) */}
      {STATUS_ROWS.map((status) =>
        Array.from({ length: 24 }, (_, h) =>
          [15, 30, 45].map((q) => {
            const x = minsToX(h * 60 + q);
            const bottom = rowTop(status) + ROW_H;
            const len = q === 30 ? ROW_H * 0.42 : ROW_H * 0.24;
            return (
              <line
                key={`tick-${status}-${h}-${q}`}
                x1={x}
                y1={bottom - len}
                x2={x}
                y2={bottom}
                stroke="#2C6E9B"
                strokeOpacity="0.35"
                strokeWidth="0.5"
              />
            );
          })
        )
      )}

      {/* Full hour vertical lines */}
      {Array.from({ length: 25 }, (_, h) => (
        <line
          key={`vl-${h}`}
          x1={minsToX(h * 60)}
          y1={PAD_T}
          x2={minsToX(h * 60)}
          y2={PAD_T + GRID_H}
          stroke="#2C6E9B"
          strokeOpacity={h % 6 === 0 ? 0.7 : 0.45}
          strokeWidth={h % 6 === 0 ? 1 : 0.6}
        />
      ))}

      {/* Horizontal row lines */}
      {Array.from({ length: 5 }, (_, i) => (
        <line
          key={`hl2-${i}`}
          x1={PAD_L}
          y1={PAD_T + i * ROW_H}
          x2={PAD_L + GRID_W}
          y2={PAD_T + i * ROW_H}
          stroke="#2C6E9B"
          strokeOpacity="0.7"
          strokeWidth="1"
        />
      ))}

      {/* Row labels + status chips + per-row totals */}
      {STATUS_ROWS.map((status) => {
        const meta = STATUS_META[status];
        return (
          <g key={`label-${status}`}>
            <rect
              x={PAD_L - 92}
              y={rowMid(status) - 5}
              width={9}
              height={9}
              rx={1.5}
              fill={meta.color}
            />
            <text
              x={PAD_L - 78}
              y={rowMid(status) + 3}
              fontSize="9.5"
              fontFamily="Inter, sans-serif"
              fill="#2A3342"
            >
              {meta.label}
            </text>
            <text
              x={PAD_L + GRID_W + 12}
              y={rowMid(status) + 4}
              fontSize="13"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
              fill="#16202E"
            >
              {formatHours(sheet.totals[status])}
            </text>
          </g>
        );
      })}

      {/* The duty status line */}
      <polyline
        points={buildDutyLine(sheet.segments)}
        fill="none"
        stroke="#16202E"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Grand total */}
      <text
        x={PAD_L + GRID_W + 12}
        y={PAD_T + GRID_H + 16}
        fontSize="12"
        fontWeight="700"
        fontFamily="JetBrains Mono, monospace"
        fill="#B47F10"
      >
        ={formatHours(totalAll)}
      </text>

      {/* Remarks band */}
      <text
        x={PAD_L - 92}
        y={PAD_T + GRID_H + 20}
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        fill="#5A5240"
        letterSpacing="1"
      >
        REMARKS
      </text>
      {sheet.remarks.map((r, i) => {
        const x = minsToX(hhmmToMinutes(r.time));
        const yTop = PAD_T + GRID_H;
        return (
          <g key={`rmk-${i}`}>
            <line x1={x} y1={yTop} x2={x} y2={yTop + 12} stroke="#16202E" strokeWidth="1" />
            <text
              x={x}
              y={yTop + 16}
              fontSize="8.5"
              fontFamily="Inter, sans-serif"
              fill="#2A3342"
              transform={`rotate(58 ${x} ${yTop + 16})`}
            >
              {r.location} &middot; {r.time}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Day start/end cities, derived from the sheet's located segments — these are
// the "From" / "To" boxes on the DOT form.
function dayEndpoints(sheet) {
  const locs = (sheet.segments || []).map((s) => s.location).filter(Boolean);
  return { from: locs[0] || "", to: locs[locs.length - 1] || "" };
}

// One labeled box from the paper form: value sits on the rule, label beneath.
// An empty value renders the blank rule a driver/carrier fills in by hand.
function FormCell({ label, value, grow }) {
  return (
    <div className={grow ? "min-w-0 flex-1" : "min-w-0"}>
      <div className="min-h-[20px] truncate border-b border-paper-line px-1.5 pb-0.5 font-mono text-[12px] text-ink">
        {value || " "}
      </div>
      {label ? (
        <div className="mt-0.5 font-mono text-[8px] uppercase leading-tight tracking-wide text-ink-500">
          {label}
        </div>
      ) : null}
    </div>
  );
}

// Faithful reproduction of the DOT "Driver's Daily Log" header block.
// Trip-planner fields are auto-filled; carrier/equipment fields are left as
// the blank ruled lines they are on the real form.
function SheetForm({ sheet, index }) {
  const [y, m, d] = sheet.date.split("-");
  const { from, to } = dayEndpoints(sheet);
  const miles = sheet.total_miles.toLocaleString();

  return (
    <div className="mb-3 border-b border-paper-line pb-3">
      {/* Title + date + filing note */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
            U.S. Department of Transportation
          </div>
          <div className="font-display text-lg font-800 leading-tight text-ink">
            Driver&rsquo;s Daily Log
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-500">
            Projected &middot; generated from HOS rules &middot; Sheet {index + 1}
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          <FormCell label="Month" value={String(Number(m))} />
          <span className="pb-3 text-ink-500">/</span>
          <FormCell label="Day" value={String(Number(d))} />
          <span className="pb-3 text-ink-500">/</span>
          <FormCell label="Year" value={y} />
        </div>
        <div className="max-w-[150px] text-right font-mono text-[8px] leading-tight text-ink-500">
          Original &mdash; file at home terminal. Duplicate &mdash; driver retains 8 days.
        </div>
      </div>

      {/* From / To */}
      <div className="mb-3 flex flex-wrap gap-4">
        <div className="flex flex-1 items-end gap-2">
          <span className="pb-0.5 font-mono text-[9px] uppercase tracking-wide text-ink-500">From</span>
          <FormCell value={from} grow />
        </div>
        <div className="flex flex-1 items-end gap-2">
          <span className="pb-0.5 font-mono text-[9px] uppercase tracking-wide text-ink-500">To</span>
          <FormCell value={to} grow />
        </div>
      </div>

      {/* Mileage + carrier */}
      <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <FormCell label="Total Miles Driving Today" value={miles} />
        <FormCell label="Total Mileage Today" value={miles} />
        <FormCell label="Name of Carrier or Carriers" value="" />
      </div>

      {/* Equipment + addresses */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormCell label="Truck/Tractor & Trailer Nos. or Plate(s)/State" value="" />
        <FormCell label="Main Office Address" value="" />
        <FormCell label="Home Terminal Address" value="" />
      </div>
    </div>
  );
}

// Bottom-of-form shipping/documents block.
function SheetDocuments({ sheet }) {
  const { from, to } = dayEndpoints(sheet);
  return (
    <div className="mt-3 border-t border-paper-line pt-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormCell label="DVL or Manifest No." value="" />
        <FormCell label="Shipper & Commodity" value="" />
      </div>
      <div className="mt-2 font-mono text-[8px] uppercase tracking-wide text-ink-500">
        Shipping documents{from && to ? ` · load ${from} → ${to}` : ""} &middot;
        carrier, equipment &amp; shipping fields completed by driver
      </div>
    </div>
  );
}

export default function LogSheet({ sheet, index }) {
  const [open, setOpen] = useState(false);
  const dateLabel = dateLabelFor(sheet);

  return (
    <>
      <div className="log-sheet rounded-lg border border-paper-edge bg-paper p-4 text-ink shadow-sm sm:p-5">
        <SheetForm sheet={sheet} index={index} />

        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Click to enlarge"
          className="group relative block w-full cursor-zoom-in rounded focus:outline-none
                     focus-visible:ring-2 focus-visible:ring-signal"
        >
          <LogGrid sheet={sheet} dateLabel={dateLabel} />
          <span
            className="no-print pointer-events-none absolute right-1 top-1 flex items-center gap-1
                       rounded bg-ink/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider
                       text-paper opacity-0 transition group-hover:opacity-100"
          >
            <ZoomIcon /> Enlarge
          </span>
        </button>

        <SheetDocuments sheet={sheet} />
      </div>

      {open && (
        <LogSheetModal
          sheet={sheet}
          index={index}
          dateLabel={dateLabel}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;
const ZOOM_DEFAULT = 1.4;
const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

function LogSheetModal({ sheet, index, dateLabel, onClose }) {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);

  // Close on Escape, zoom with -/+, and lock body scroll while open.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") setZoom((z) => clampZoom(z + ZOOM_STEP));
      else if (e.key === "-") setZoom((z) => clampZoom(z - ZOOM_STEP));
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function onWheel(e) {
    e.preventDefault();
    setZoom((z) => clampZoom(z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
  }

  return (
    <div
      className="no-print fixed inset-0 z-50 flex flex-col bg-ink/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Enlarged log sheet for ${dateLabel}`}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-4 border-b border-ink-700 bg-ink-800 px-4 py-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-700 text-paper">
            Driver&rsquo;s Daily Log &middot; {dateLabel}
          </div>
          <div className="font-mono text-[11px] text-ink-500">
            Sheet {index + 1} &middot; scroll or use &minus;/+ to zoom
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <ZoomButton
            label="Zoom out"
            onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
            disabled={zoom <= ZOOM_MIN}
          >
            &minus;
          </ZoomButton>
          <span className="w-12 text-center font-mono text-xs text-paper">
            {Math.round(zoom * 100)}%
          </span>
          <ZoomButton
            label="Zoom in"
            onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
            disabled={zoom >= ZOOM_MAX}
          >
            +
          </ZoomButton>
          <ZoomButton label="Reset zoom" onClick={() => setZoom(ZOOM_DEFAULT)}>
            <span className="font-mono text-[11px]">1:1</span>
          </ZoomButton>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-1 rounded-md border border-ink-600 px-3 py-1.5 font-mono text-xs
                       uppercase tracking-wider text-ink-500 transition hover:text-paper"
          >
            Close &times;
          </button>
        </div>
      </div>

      {/* Scrollable, zoomable canvas */}
      <div className="flex-1 overflow-auto p-4 sm:p-8" onWheel={onWheel} onClick={onClose}>
        <div
          className="mx-auto rounded-lg border border-paper-edge bg-paper p-5 shadow-xl"
          style={{ width: `${Math.round(zoom * 100)}%`, maxWidth: "none" }}
          onClick={(e) => e.stopPropagation()}
        >
          <SheetForm sheet={sheet} index={index} />
          <LogGrid sheet={sheet} dateLabel={dateLabel} />
          <SheetDocuments sheet={sheet} />
        </div>
      </div>
    </div>
  );
}

function ZoomButton({ children, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-ink-600
                 font-mono text-base leading-none text-paper transition hover:border-signal
                 hover:text-signal disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ZoomIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
      <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="7" y1="4.5" x2="7" y2="9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="4.5" y1="7" x2="9.5" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
