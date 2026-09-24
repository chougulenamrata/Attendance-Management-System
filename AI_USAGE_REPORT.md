# AI Usage Report

## Tools used

- GitHub Copilot: project planning, code generation, UI copy, API shape, and review of the implementation.
- Node.js runtime: local execution and endpoint validation.

## How AI was used

1. Turned the assignment into a focused MVP: attendance marking, student monitoring, low-attendance detection, correction approval, and audit history.
2. Chose an Express server with a static HTML/CSS/JavaScript client so the prototype has a small operational footprint and can be evaluated with one command.
3. Generated seeded domain data and REST handlers for the main workflows.
4. Generated the responsive dashboard UI with explicit states for empty/healthy watchlists, pending/approved/rejected corrections, and mobile layout.
5. Added README decisions and a scale path for moving from the demo store to MySQL.

## Important prompts/tasks

- Asked AI to preserve the existing Express/static UI implementation and extend it rather than rebuild it.
- Asked AI to model MySQL persistence, JWT roles, explicit correction status transitions, low-attendance reporting, and student/admin workflows.
- Asked AI to validate the 5,000-student and 500-faculty scale and the faculty selection interaction in the browser.

## Validation performed

- Started the app with `npm start` and confirmed it served the dashboard at `http://localhost:3000`.
- Called `GET /api/bootstrap` and checked that the response contained summary metrics, students, subjects, correction requests, and audit events.
- Called `POST /api/attendance` with a valid class register and checked that the response returned HTTP 201 and updated summary data.
- Called `PATCH /api/corrections/CR-1001` with `approved` and checked that the request status changed and the audit trail gained an event.
- Checked the browser-facing HTML response and verified the static assets were served.
- Ran `npm test`, which starts an isolated server and verifies invalid/valid login, role protection, scale counts, reports, duplicate attendance rejection, duplicate pending correction rejection, and correction rejection.
- Ran `node --check server.js`, `node --check db.js`, and `node --check public/app.js` after the final implementation.
- Discovered and fixed startup timing in the test harness, duplicate attendance behavior, incomplete correction status data, and a stale duplicate bootstrap route during validation.

## Human review and known limitations

The prototype was manually reviewed for role boundaries, duplicate attendance behavior, threshold calculation, correction auditability, and responsive layout. The MySQL schema and connection/transaction helper are present, but the current assessment routes still use the in-memory demo repository; persistence integration is an intentional limitation. The dedicated browser sign-in stores JWTs in local storage for the local assessment demo; production should use secure cookies, CSRF protection, and database-backed user provisioning.
