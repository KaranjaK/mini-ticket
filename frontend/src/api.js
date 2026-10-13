// Isolate all API calls to a single file so that we can easily change the backend URL if needed.
async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // DRF errors look like {field: ["message"]}; flatten for display.
    const msg = Object.entries(body).map(([k, v]) => `${k}: ${[].concat(v).join(" ")}`).join(" · ");
    throw new Error(msg || `Request failed (${res.status})`);
  }
  return body;
}

export const listTickets = ({ status, page, limit }) => {
  const q = new URLSearchParams({ page, limit });
  if (status) q.set("status", status);
  return request(`/tickets?${q}`);
};
export const createTicket = (data) => request("/tickets", { method: "POST", body: JSON.stringify(data) });
export const updateTicket = (id, data) => request(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const getStats = () => request("/tickets/stats");