// A realistic 2-day trip used until the backend is live.
// Dallas TX -> pickup Oklahoma City OK -> dropoff Denver CO, cycle used 10h.
// Day 1 hits the 11-hour driving limit and takes a 10-hour reset across midnight.
// Times inside log_sheets are HH:MM within that day ("24:00" = end-of-day boundary).

export const MOCK_TRIP = {
  summary: {
    total_miles: 955,
    total_drive_hours: 14.5,
    total_duration_hours: 27,
    num_days: 2,
    num_fuel_stops: 1,
    num_rests: 1,
    cycle_used_start: 10,
    cycle_used_end: 27,
  },
  points: {
    current: { label: "Dallas, TX", lat: 32.7767, lng: -96.797 },
    pickup: { label: "Oklahoma City, OK", lat: 35.4676, lng: -97.5164 },
    dropoff: { label: "Denver, CO", lat: 39.7392, lng: -104.9903 },
  },
  route: {
    geometry: [
      [32.7767, -96.797],
      [33.6, -97.1],
      [35.4676, -97.5164],
      [36.6, -97.45],
      [37.6872, -97.3301],
      [37.97, -100.8727],
      [38.08, -102.62],
      [39.2, -104.6],
      [39.7392, -104.9903],
    ],
    legs: [
      { from: "Dallas, TX", to: "Oklahoma City, OK", miles: 207, drive_hours: 3.0 },
      { from: "Oklahoma City, OK", to: "Denver, CO", miles: 748, drive_hours: 11.5 },
    ],
  },
  stops: [
    { type: "pickup", lat: 35.4676, lng: -97.5164, label: "Pickup — Oklahoma City, OK", time: "2026-06-11T11:00:00" },
    { type: "fuel", lat: 37.6872, lng: -97.3301, label: "Fuel — Wichita, KS", time: "2026-06-11T16:00:00" },
    { type: "rest_10h", lat: 37.97, lng: -100.8727, label: "10-hour reset — Garden City, KS", time: "2026-06-11T20:30:00" },
    { type: "dropoff", lat: 39.7392, lng: -104.9903, label: "Drop-off — Denver, CO", time: "2026-06-12T10:00:00" },
  ],
  segments: [
    { status: "off_duty", start: "2026-06-11T00:00:00", end: "2026-06-11T08:00:00", duration_hours: 8.0, location: "Dallas, TX", note: "" },
    { status: "driving", start: "2026-06-11T08:00:00", end: "2026-06-11T11:00:00", duration_hours: 3.0, location: "Dallas, TX", note: "To pickup" },
    { status: "on_duty", start: "2026-06-11T11:00:00", end: "2026-06-11T12:00:00", duration_hours: 1.0, location: "Oklahoma City, OK", note: "Pickup" },
    { status: "driving", start: "2026-06-11T12:00:00", end: "2026-06-11T16:00:00", duration_hours: 4.0, location: "Oklahoma City, OK", note: "" },
    { status: "on_duty", start: "2026-06-11T16:00:00", end: "2026-06-11T16:30:00", duration_hours: 0.5, location: "Wichita, KS", note: "Fuel (also 30-min break)" },
    { status: "driving", start: "2026-06-11T16:30:00", end: "2026-06-11T20:30:00", duration_hours: 4.0, location: "Wichita, KS", note: "" },
    { status: "sleeper", start: "2026-06-11T20:30:00", end: "2026-06-12T06:30:00", duration_hours: 10.0, location: "Garden City, KS", note: "10-hour reset" },
    { status: "driving", start: "2026-06-12T06:30:00", end: "2026-06-12T10:00:00", duration_hours: 3.5, location: "Garden City, KS", note: "To drop-off" },
    { status: "on_duty", start: "2026-06-12T10:00:00", end: "2026-06-12T11:00:00", duration_hours: 1.0, location: "Denver, CO", note: "Drop-off" },
    { status: "off_duty", start: "2026-06-12T11:00:00", end: "2026-06-13T00:00:00", duration_hours: 13.0, location: "Denver, CO", note: "" },
  ],
  log_sheets: [
    {
      date: "2026-06-11",
      total_miles: 725,
      totals: { off_duty: 8.0, sleeper: 3.5, driving: 11.0, on_duty: 1.5 },
      segments: [
        { status: "off_duty", start: "00:00", end: "08:00", location: "Dallas, TX", note: "" },
        { status: "driving", start: "08:00", end: "11:00", location: "Dallas, TX", note: "To pickup" },
        { status: "on_duty", start: "11:00", end: "12:00", location: "Oklahoma City, OK", note: "Pickup" },
        { status: "driving", start: "12:00", end: "16:00", location: "Oklahoma City, OK", note: "" },
        { status: "on_duty", start: "16:00", end: "16:30", location: "Wichita, KS", note: "Fuel" },
        { status: "driving", start: "16:30", end: "20:30", location: "Wichita, KS", note: "" },
        { status: "sleeper", start: "20:30", end: "24:00", location: "Garden City, KS", note: "10-hour reset" },
      ],
      remarks: [
        { time: "08:00", location: "Dallas, TX" },
        { time: "11:00", location: "Oklahoma City, OK" },
        { time: "16:00", location: "Wichita, KS" },
        { time: "20:30", location: "Garden City, KS" },
      ],
    },
    {
      date: "2026-06-12",
      total_miles: 230,
      totals: { off_duty: 13.0, sleeper: 6.5, driving: 3.5, on_duty: 1.0 },
      segments: [
        { status: "sleeper", start: "00:00", end: "06:30", location: "Garden City, KS", note: "10-hour reset" },
        { status: "driving", start: "06:30", end: "10:00", location: "Garden City, KS", note: "To drop-off" },
        { status: "on_duty", start: "10:00", end: "11:00", location: "Denver, CO", note: "Drop-off" },
        { status: "off_duty", start: "11:00", end: "24:00", location: "Denver, CO", note: "" },
      ],
      remarks: [
        { time: "06:30", location: "Garden City, KS" },
        { time: "10:00", location: "Denver, CO" },
        { time: "11:00", location: "Denver, CO" },
      ],
    },
  ],
};
