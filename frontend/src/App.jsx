import { useCallback, useEffect, useState } from "react";
import { createTicket, getStats, listTickets, updateTicket } from "./api.js";

const STATUSES = ["open", "in_progress", "closed"];
const PRIORITIES = ["low", "medium", "high"];
const LABEL = { open: "Open", in_progress: "In progress", closed: "Closed", low: "Low", medium: "Medium", high: "High" };
const STATUS_STYLE = {
  open: "bg-sky-100 text-sky-800",
  in_progress: "bg-amber-100 text-amber-800",
  closed: "bg-stone-200 text-stone-600",
};
const PRIORITY_STYLE = { low: "text-stone-500", medium: "text-stone-800", high: "text-rose-700 font-semibold" };
const LIMIT = 8;

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, closed: 0 });
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [data, s] = await Promise.all([listTickets({ status: filter, page, limit: LIMIT }), getStats()]);
      setTickets(data.results);
      setTotal(data.count);
      setStats(s);
      setError("");
    } catch (e) {
      // Deleting the last item on a page isn't possible here, but a stale page can still 404.
      if (page > 1 && /not found/i.test(e.message)) setPage(1);
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id, status) => {
    try { await updateTicket(id, { status }); await load(); } catch (e) { setError(e.message); }
  };

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Support tickets</h1>
      <p className="mt-1 text-sm text-stone-500">
        {stats.open} open · {stats.in_progress} in progress · {stats.closed} closed
      </p>

      {error && <p role="alert" className="mt-4 rounded bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

      <NewTicketForm onCreated={() => { setPage(1); load(); }} onError={setError} />

      <div className="mt-8 flex items-center gap-2" role="tablist" aria-label="Filter by status">
        {["", ...STATUSES].map((s) => (
          <button
            key={s || "all"}
            onClick={() => { setFilter(s); setPage(1); }}
            className={`rounded-full px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-stone-900 ${
              filter === s ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-stone-100"
            }`}
          >
            {s ? LABEL[s] : "All"}
          </button>
        ))}
      </div>

      <ul className="mt-4 divide-y divide-stone-200 rounded-lg bg-white ring-1 ring-stone-200">
        {loading && <li className="p-6 text-sm text-stone-500">Loading tickets…</li>}
        {!loading && tickets.length === 0 && (
          <li className="p-6 text-sm text-stone-500">No tickets here yet. Create one above.</li>
        )}
        {tickets.map((t) => (
          <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t.title}</p>
              {t.description && <p className="mt-0.5 line-clamp-2 text-sm text-stone-600">{t.description}</p>}
              <p className="mt-1 text-xs text-stone-400">{new Date(t.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${PRIORITY_STYLE[t.priority]}`}>{LABEL[t.priority]} priority</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[t.status]}`}>
                {LABEL[t.status]}
              </span>
              <select
                aria-label={`Change status of ${t.title}`}
                value={t.status}
                onChange={(e) => changeStatus(t.id, e.target.value)}
                className="rounded border border-stone-300 bg-white px-2 py-1 text-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
              </select>
            </div>
          </li>
        ))}
      </ul>

      <nav className="mt-4 flex items-center justify-between text-sm text-stone-600" aria-label="Pagination">
        <span>{total} ticket{total === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded px-3 py-1 ring-1 ring-stone-300 disabled:opacity-40">Previous</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded px-3 py-1 ring-1 ring-stone-300 disabled:opacity-40">Next</button>
        </div>
      </nav>
    </main>
  );
}

function NewTicketForm({ onCreated, onError }) {
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createTicket(form);
      setForm({ title: "", description: "", priority: "medium" });
      onCreated();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 grid gap-3 rounded-lg bg-white p-4 ring-1 ring-stone-200 sm:grid-cols-[1fr_auto]">
      <label className="block text-sm">
        <span className="font-medium">Title</span>
        <input required maxLength={200} value={form.title} onChange={set("title")}
          className="mt-1 w-full rounded border border-stone-300 px-3 py-2" placeholder="Customer can't reset password" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Priority</span>
        <select value={form.priority} onChange={set("priority")} className="mt-1 w-full rounded border border-stone-300 bg-white px-3 py-2">
          {PRIORITIES.map((p) => <option key={p} value={p}>{LABEL[p]}</option>)}
        </select>
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="font-medium">Description <span className="font-normal text-stone-400">(optional)</span></span>
        <textarea rows={2} value={form.description} onChange={set("description")} className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
      </label>
      <div className="sm:col-span-2">
        <button disabled={saving} className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50">
          {saving ? "Creating…" : "Create ticket"}
        </button>
      </div>
    </form>
  );
}