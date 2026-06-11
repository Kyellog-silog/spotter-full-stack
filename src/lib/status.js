// Duty statuses in the exact order they appear as rows on the DOT log grid.
export const STATUS_ROWS = ["off_duty", "sleeper", "driving", "on_duty"];

export const STATUS_META = {
  off_duty: { label: "Off Duty", short: "OFF", color: "#6B7A8F" },
  sleeper: { label: "Sleeper Berth", short: "SB", color: "#3B5BA5" },
  driving: { label: "Driving", short: "D", color: "#E8A317" },
  on_duty: { label: "On Duty (Not Driving)", short: "ON", color: "#B5651D" },
};

export const STOP_META = {
  pickup: { label: "Pickup", color: "#E8A317" },
  dropoff: { label: "Drop-off", color: "#F6B82E" },
  fuel: { label: "Fuel", color: "#3B5BA5" },
  break_30m: { label: "30-min break", color: "#6B7A8F" },
  rest_10h: { label: "10-hour reset", color: "#B5651D" },
  restart_34h: { label: "34-hour restart", color: "#B5651D" },
};

// "HH:MM" (or "24:00") -> minutes from midnight
export function hhmmToMinutes(s) {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

export function formatHours(n) {
  return Number(n).toFixed(2).replace(/\.00$/, ".0");
}
