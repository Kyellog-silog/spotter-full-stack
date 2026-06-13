// Duty statuses in the exact order they appear as rows on the DOT log grid.
export const STATUS_ROWS = ["off_duty", "sleeper", "driving", "on_duty"];

// Duty-row + marker colors mirror the Wayline design palette.
export const STATUS_META = {
  off_duty: { label: "Off Duty", short: "OFF", color: "#64748b" },
  sleeper: { label: "Sleeper Berth", short: "SB", color: "#7c5cff" },
  driving: { label: "Driving", short: "D", color: "#d97706" },
  on_duty: { label: "On Duty (Not Driving)", short: "ON", color: "#0d9488" },
};

export const STOP_META = {
  pickup: { label: "Pickup", color: "#d97706" },
  dropoff: { label: "Drop-off", color: "#16a34a" },
  fuel: { label: "Fuel", color: "#0d9488" },
  break_30m: { label: "30-min break", color: "#8b5cf6" },
  rest_10h: { label: "10-hour reset", color: "#5b6b80" },
  restart_34h: { label: "34-hour restart", color: "#e11d48" },
};

// "HH:MM" (or "24:00") -> minutes from midnight
export function hhmmToMinutes(s) {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

export function formatHours(n) {
  return Number(n).toFixed(2).replace(/\.00$/, ".0");
}
