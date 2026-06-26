# Architecture

The monorepo separates the marketing frontend from the API backend.

## Frontend

- React pages are lazy-loaded through React Router.
- Shared UI lives in `src/components`.
- Page data lives in `src/constants`.
- Form state and validation are reusable through `useForm` and validation helpers.
- The approved design is preserved through Tailwind classes and shared CSS tokens in `src/styles/global.css`.

## Backend

- Express app factory in `src/app.js`.
- Controllers are thin HTTP adapters.
- Services own validation, sanitization, and database writes.
- PostgreSQL access is centralized in `src/database/pool.js`.
- Central error handling returns consistent JSON responses.

## Future Expansion

The folder structure leaves clear places for authentication, admin dashboard routes, CMS/blog models, portfolio management, analytics events, payments, and a client portal.
