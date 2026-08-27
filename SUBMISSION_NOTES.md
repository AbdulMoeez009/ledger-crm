# Ledger CRM Submission Notes

## Project status

- Project 2: Express REST API with validation, JSON responses, status codes, CORS, and CRUD endpoints.
- Project 3: SQLite persistence with primary keys, a dialers foreign key, UNIQUE/NOT NULL/CHECK constraints, seeded data, and parameterized SQL.
- Frontend: Dashboard, Leads, Pipeline, Follow-ups, Revenue, Profile, notifications, filters, forms, and modals are connected to the live API.

## Run locally

```bash
npm install
npm start
```

- Application and API: `http://localhost:8000`
- Optional Live Server frontend: `http://localhost:5500`

## Final verification

- API health returns `status: ok` and `database: sqlite`.
- Database returns the seeded CRM leads after startup.
- Create, update, replace, and delete operations were tested with temporary data and cleaned up.
- Invalid input returns `400`; duplicate email returns `409`; missing records return `404`.
- The repository is published on GitHub under the `refactor/modular-structure` branch.

## Screenshots

Capture the Dashboard, Leads, Pipeline, Follow-ups, and Revenue views from `http://localhost:8000` after running the project. Attach those screenshots in the submission portal.