import { MOCK_TRIP } from "./mockTrip.js";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// Set VITE_USE_MOCK=true to demo offline without the backend.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function planTrip(input) {
  if (USE_MOCK) {
    // Simulate the network so loading states are visible during the demo.
    await delay(700);
    return MOCK_TRIP;
  }

  const res = await fetch(`${API_BASE}/api/plan-trip/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data.detail || Object.values(data).flat().join(" ");
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json();
}
