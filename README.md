# My Mini-Ticket Project

This is a Django-Python + DRF REST API, PostgreSQL, and React + Tailwind UI system for tracking the support tickets for customers

```
mini-tracker/
├── docker-compose.yml     # PostgreSQL 16
├── backend/               # Django project (config/) + tickets app
└── frontend/              # Vite + React + Tailwind v4
```

## Setup and run

Prerequisites: Python 3.10+, Node 18+, Docker (or any local PostgreSQL).

**1. Database**
```bash
docker compose up -d db
```

**2. Backend** (http://localhost:8000)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
DB settings default to the docker-compose values. Override with `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`.

**3. Frontend** (http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```
The Vite dev server proxies `/tickets` to Django, so no CORS configuration is needed.

## API

| Method | Path | Notes |
|---|---|---|
| POST | `/tickets` | Body: `title` (required), `description`, `priority`, `status` |
| GET | `/tickets` | `?status=open\|in_progress\|closed&page=1&limit=10` (limit max 100). Returns `{count, next, previous, results}` |
| PATCH | `/tickets/:id` | Only `status` and `priority` are accepted |
| GET | `/tickets/stats` | `{"open": 2, "in_progress": 0, "closed": 1}` (all statuses always present) |

Quick check:
```bash
curl -X POST localhost:8000/tickets -H 'Content-Type: application/json' -d '{"title":"Login broken","priority":"high"}'
curl localhost:8000/tickets/stats
```

## Tests

Five integration tests cover create (defaults and validation), list filtering and pagination, PATCH (including that other fields are ignored), and stats.

```bash
cd backend
python manage.py test                 # runs against PostgreSQL (Django creates test_tickets)
USE_SQLITE=1 python manage.py test    # no database needed, handy for a quick check
```

## Decisions and Tradeoffs

I used Django REST Framework for serializers, validation and pagination, because hand-rolling those in a 3 to 4 hour window would have cost more time than the dependency is worth. Scope was sized for a 3 to 4 hour build, so I prioritised a working API with tests over UI polish. Tickets use UUID primary keys, and list ordering is `-created_at` with `id` as a tiebreaker so pages stay stable. PATCH uses a separate narrow serializer so only status and priority can change, and unknown fields are silently ignored rather than rejected. The Vite proxy replaces CORS configuration, which is fine for development but is not a production deployment story. The UI is one `App.jsx` with a form component, no router, no state library, and it refetches the list and stats after every change instead of updating optimistically, which keeps it simple at the cost of an extra round trip. Authentication, rate limiting, ticket deletion, and editing the title or description are deliberately out of scope. With more time I would add frontend tests (Vitest and Testing Library), split `App.jsx` into components, add optimistic updates with rollback, add search and sort, add a database index on `created_at`, containerise the full stack, improve accessibility, and use cursor-based pagination if the table were expected to grow large.

## Copyright
2026 (C) 2026, Kelvin Karanja Irungu