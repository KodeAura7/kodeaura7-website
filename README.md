# KodeAura7 Company Website

Production-ready monorepo for the KodeAura7 marketing website and API.

## Structure

```text
frontend/   React 19, Vite, React Router, Tailwind CSS
backend/    Express API, PostgreSQL, Neon-ready migrations
docs/       Reference exports and architecture notes
.github/   CI, issue templates, PR template, CODEOWNERS
```

## Development

```bash
npm install
npm run dev
npm run dev:backend
```

Frontend runs on `http://localhost:5173`. Backend defaults to `http://localhost:4000`.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:

```text
DATABASE_URL=
CORS_ORIGIN=http://localhost:5173
PORT=4000
```

Frontend can optionally set `VITE_API_BASE_URL` when calling a deployed API.

## Database

Run migrations after configuring Neon PostgreSQL:

```bash
npm run migrate --workspace backend
```

The initial schema supports contact messages and newsletter subscribers, with room for future admin, CMS, blog, payments, analytics, and client portal features.

## Deployment

Frontend: deploy `frontend/` to Vercel using `frontend/vercel.json`.

Backend: deploy `backend/` to Render using `backend/render.yaml`.

Production branch: `main` at `https://mydomain.com`.

Sandbox branch: `develop` at `https://staging.mydomain.com`.

## Git Workflow

Use Git Flow:

```text
main
develop
feature/*
bugfix/*
release/*
hotfix/*
```

Open pull requests into `develop` for integration. Merge tested releases into `main` for production.

## CI/CD

GitHub Actions run lint/build checks on pull requests. Deployment jobs are stubbed with required secrets for Vercel and Render.

## Design Source Of Truth

The original Claude Design HTML exports and design system are preserved in `docs/reference/design-files/`. Do not redesign the UI unless the approved design files change.
