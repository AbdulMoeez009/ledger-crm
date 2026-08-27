# Ledger CRM

A full-stack CRM dashboard with an Express REST API and SQLite persistence. Leads loaded from the database remain available after refresh, and all add, edit, mark-won, and delete actions are persisted.

## Project structure

- `index.html` — application entry point and semantic page structure
- `css/style.css` — all styling, responsive behavior, and theme variables
- `js/` — modular JavaScript logic split by responsibility
  - `script.js` — main app bootstrap and rendering
  - `state.js` — lead data, filters, formatting helpers, and CSV export logic
  - `navigation.js` — view switching and global search events
  - `theme.js` — dark theme initialization
  - `notifications.js` — notification panel and modal behavior
  - `profile.js` — profile panel interactions
  - `settings.js` — settings modal behavior
  - `modal-a11y.js` — accessibility helpers for dialogs
  - `toast.js` — toast notifications
  - `dom.js` — reusable DOM utilities
  - `shortcuts.js` — keyboard shortcuts
  - `api.js` — REST API client for database-backed lead operations

## Project 2 and 3 backend

- `server.js` — Express API, validation, CORS for Live Server, and SQLite schema
- `ledger.db` — local SQLite database with seeded CRM leads
- `GET /api/leads` — list leads
- `POST /api/leads` — create a lead
- `PUT /api/leads/:id` — replace a lead
- `PATCH /api/leads/:id` — update a lead
- `DELETE /api/leads/:id` — delete a lead
- `dialers` table — lead dialer foreign-key relationship via `dialer_id`

## Run the project

Because this app uses native ES modules, it must be served over a local HTTP server instead of opened directly from the file system.

1. Open a terminal in the project folder.
2. Run:

```bash
npm start
```

3. Open the dashboard at either:

```text
http://localhost:8000
http://localhost:5500
```

For `5500`, run VS Code Live Server on `index.html`. The frontend automatically sends API requests to the Express server on port `8000`.

## Notes

- The app is intentionally served via HTTP so browser module loading works correctly.
- The design was preserved from the original dashboard while improving maintainability and accessibility.
- The project keeps the same interactive flows: navigation, filtering, lead forms, revenue views, notifications, and modal dialogs.
- The dashboard uses a single dark Obsidian Gold theme.
