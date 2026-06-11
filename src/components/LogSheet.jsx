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

export default function LogSheet({ sheet, index }) {
  const totalAll =
    sheet.totals.off_duty +
    sheet.totals.sleeper +
    sheet.totals.driving +
    sheet.totals.on_duty;

  const dateLabel = new Date(sheet.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="log-sheet rounded-lg border border-paper-edge bg-paper p-4 text-ink shadow-sm sm:p-5">
      {/* Header band, styled like the paper form */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-paper-line pb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
            U.S. Department of Transportation
          </div>
          <div className="font-display text-lg font-800 leading-tight text-ink">
            Driver&rsquo;s Daily Log
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-500">
            One calendar day &mdash; 24 hours &middot; Sheet {index + 1}
          </div>
        </div>
        <div className="flex gap-5">
          <HeaderField label="Date" value={dateLabel} />
          <HeaderField label="Total miles" value={sheet.total_miles.toLocaleString()} />
        </div>
      </div>

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

        {/* Quarter-hour ticks inside each row */}
        {STATUS_ROWS.map((status) =>
          Array.from({ length: 24 }, (_, h) =>
            [15, 30, 45].map((q) => {
              const x = minsToX(h * 60 + q);
              const top = rowTop(status);
              const len = q === 30 ? ROW_H * 0.42 : ROW_H * 0.24;
              return (
                <line
                  key={`tick-${status}-${h}-${q}`}
                  x1={x}
                  y1={top}
                  x2={x}
                  y2={top + len}
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
    </div>
  );
}

function HeaderField({ label, value }) {
  return (
    <div className="text-right">
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-500">
        {label}
      </div>
      <div className="font-mono text-sm font-700 text-ink">{value}</div>
    </div>
  );
}
