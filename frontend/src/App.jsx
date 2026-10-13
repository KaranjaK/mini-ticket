import { useCallback, useEffect, useState } from "react";
import { createTicket, getStats, listTickets, updateTicket } from "./api.js";

const STATUSES = ["open", "in_progress", "closed"];
const PRIORITIES = ["low", "medium", "high"];
const LABEL = { open: "Open", in_progress: "In progress", closed: "Closed", low: "Low", medium: "Medium", high: "High" };
const STATUS_STYLE = {
  open: "bg-sky-50 text-sky-700 ring-sky-600/20",
  in_progress: "bg-amber-50 text-amber-700 ring-amber-600/20",
  closed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};
const PRIORITY_STYLE = {
  low: "bg-stone-100 text-stone-600",
  medium: "bg-indigo-50 text-indigo-700",
  high: "bg-rose-50 text-rose-700",
};
const SUMMARY_STYLE = {
  open: "border-sky-200 before:bg-sky-500",
  in_progress: "border-amber-200 before:bg-amber-500",
  closed: "border-emerald-200 before:bg-emerald-500",
};
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
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Ticket desk</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">Support tickets</h1>
        <p className="mt-2 text-sm text-stone-600">Keep track of customer requests and what needs attention.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Ticket summary">
        {STATUSES.map((status) => (
          <article
            key={status}
            className={`relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1 ${SUMMARY_STYLE[status]}`}
          >
            <p className="text-sm font-medium text-stone-600">{LABEL[status]}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-stone-950">{stats[status]}</p>
          </article>
        ))}
      </section>

      {error && (
        <p role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      <NewTicketForm onCreated={() => { setPage(1); load(); }} onError={setError} />

      <div className="mt-9 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
        <span className="mr-1 text-sm font-semibold text-stone-700">Tickets</span>
        {["", ...STATUSES].map((s) => (
          <button
            key={s || "all"}
            type="button"
            aria-pressed={filter === s}
            onClick={() => { setFilter(s); setPage(1); }}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              filter === s ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            {s ? LABEL[s] : "All"}
          </button>
        ))}
      </div>

      <ul className="mt-4 divide-y divide-stone-100 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-stone-200/80">
        {loading ? Array.from({ length: 3 }, (_, i) => (
          <li key={i} aria-hidden="true" className="animate-pulse space-y-3 p-5">
            <div className="h-4 w-1/3 rounded bg-stone-200" />
            <div className="h-3 w-2/3 rounded bg-stone-100" />
            <div className="h-3 w-1/4 rounded bg-stone-100" />
          </li>
        )) : tickets.length === 0 ? (
          <li className="p-8 text-center">
            <p className="font-semibold text-stone-800">No tickets to show</p>
            <p className="mt-1 text-sm text-stone-500">Try another status filter or create a new ticket above.</p>
          </li>
        ) : tickets.map((t) => (
          <li key={t.id} className="flex flex-wrap items-start justify-between gap-4 p-5 transition-colors hover:bg-stone-50/80">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-stone-900">{t.title}</p>
              {t.description && <p className="mt-0.5 line-clamp-2 text-sm text-stone-600">{t.description}</p>}
              <p className="mt-2 text-xs text-stone-500">{new Date(t.created_at).toLocaleString()}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_STYLE[t.priority]}`}>
                {LABEL[t.priority]} priority
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLE[t.status]}`}>
                {LABEL[t.status]}
              </span>
              <select
                aria-label={`Change status of ${t.title}`}
                value={t.status}
                onChange={(e) => changeStatus(t.id, e.target.value)}
                className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg bg-white px-3 py-1.5 font-medium text-stone-700 shadow-sm ring-1 ring-stone-300 transition hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-lg bg-white px-3 py-1.5 font-medium text-stone-700 shadow-sm ring-1 ring-stone-300 transition hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
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
    <form onSubmit={submit} className="mt-7 grid gap-4 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:p-6">
      <div className="sm:col-span-2">
        <h2 className="text-lg font-semibold tracking-tight text-stone-900">Create a ticket</h2>
        <p className="mt-1 text-sm text-stone-500">Add a customer request to your queue.</p>
      </div>
      <label className="block text-sm">
        <span className="font-semibold text-stone-700">Title</span>
        <input required maxLength={200} value={form.title} onChange={set("title")}
          className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          placeholder="Customer can't reset password" />
      </label>
      <label className="block text-sm">
        <span className="font-semibold text-stone-700">Priority</span>
        <select value={form.priority} onChange={set("priority")} className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
          {PRIORITIES.map((p) => <option key={p} value={p}>{LABEL[p]}</option>)}
        </select>
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="font-semibold text-stone-700">Description <span className="font-normal text-stone-400">(optional)</span></span>
        <textarea rows={2} value={form.description} onChange={set("description")} className="mt-1.5 w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
      </label>
      <div className="sm:col-span-2">
        <button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60">
          {saving ? "Creating…" : "Create ticket"}
        </button>
      </div>
    </form>
  );
}