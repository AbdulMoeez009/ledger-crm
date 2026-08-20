# Ledger CRM

A modular CRM dashboard built as a single-page web app, refactored from a monolithic HTML file into a clean ES module structure while preserving the original design and functionality.

## Project structure

- `index.html` — application entry point and semantic page structure
- `css/style.css` — all styling, responsive behavior, and theme variables
- `js/` — modular JavaScript logic split by responsibility
  - `script.js` — main app bootstrap and rendering
  - `state.js` — lead data, filters, formatting helpers, and CSV export logic
  - `navigation.js` — view switching and global search events
  - `theme.js` — dark/light theme behavior
  - `notifications.js` — notification panel and modal behavior
  - `profile.js` — profile panel interactions
  - `settings.js` — settings modal behavior
  - `modal-a11y.js` — accessibility helpers for dialogs
  - `toast.js` — toast notifications
  - `dom.js` — reusable DOM utilities
  - `shortcuts.js` — keyboard shortcuts

## Run the project

Because this app uses native ES modules, it must be served over a local HTTP server instead of opened directly from the file system.

1. Open a terminal in the project folder.
2. Run:

```bash
python -m http.server 8000
```

3. Open:

```text
http://localhost:8000
```

## Notes

- The app is intentionally served via HTTP so browser module loading works correctly.
- The design was preserved from the original dashboard while improving maintainability and accessibility.
- The project keeps the same interactive flows: navigation, filtering, lead forms, revenue views, theme toggle, notifications, and modal dialogs.
