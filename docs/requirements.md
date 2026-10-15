\*\*Assumptions\*\* (the repo only has scaffolding, so please confirm): a single-tenant web app with a frontend and a REST backend, no authentication for the demo, and a relational or in-memory store. Ticket fields are `id`, `title`, `description`, `status` (Open, In Progress, Resolved, Closed), `priority` (Low, Medium, High), `requester`, `assignee`, `createdAt` and `updatedAt`.



\## 1. Gap Analysis (baseline CRUD vs. a demo-worthy helpdesk)



| Area | Baseline CRUD | Gap | Demo priority |

|---|---|---|---|

| Lifecycle | Free-text or no status | Defined status set and allowed transitions | \*\*Must\*\* |

| Priority | None | Priority field and filter | \*\*Must\*\* |

| Discoverability | Plain list | Filter by status/priority, keyword search, sort | \*\*Must\*\* |

| Validation | Often none | Server-side and client-side rules, consistent error shape | \*\*Must\*\* |

| Delete | Hard delete | Soft delete or confirm step, to avoid data loss | Should |

| Audit | None | `createdAt` and `updatedAt` only | Should |

| Auth/roles | None | Out of scope, noted as a risk | Won't (1 day) |

| Comments, attachments, SLA, notifications | None | Out of scope, backlog | Won't |

| Quality | Untested | Basic API and UI tests, seed data | \*\*Must\*\* |



\*\*Open questions for the human (HITL #1):\*\*

1\. Are the status set and transitions above acceptable?

2\. Is soft delete acceptable, or must it be a hard delete?

3\. Is the stack already decided? The repo has `frontend/`, `backend/` and `docs/` folders.

4\. Is a single-user demo with no login acceptable?



\## 2. EPIC



\*\*HD-EPIC-1: Helpdesk Ticket Management (MVP)\*\*

\*Goal:\* Let a support user create, find, view, update and retire tickets through a validated, demo-ready web app within one day.

\*Success:\* A live demo walks through the full ticket lifecycle with no unhandled errors, and the automated tests pass.

\*Out of scope:\* auth, comments, attachments, SLA, notifications.



\## 3. User Stories, Acceptance Criteria and Tasks



Priority order is HD-1, HD-2, HD-3, HD-4, HD-5, HD-6. Each story is sized for about 1–1.5 hours, which fits a one-day demo.



\### HD-1: Create a ticket (P1, Must)

\*As a requester, I want to submit a ticket so that support knows my issue.\*



\*\*Acceptance criteria\*\*

\- \*\*Given\*\* the create form, \*\*when\*\* I submit a valid title, description and priority, \*\*then\*\* the ticket is saved with status `Open` and I see a success confirmation.

\- \*\*Given\*\* the title is empty or longer than 100 characters, \*\*when\*\* I submit, \*\*then\*\* I see a field-level error and nothing is saved.

\- \*\*Given\*\* a ticket was created, \*\*then\*\* it has a generated `id`, `createdAt` and `updatedAt`.



\*\*Tasks\*\*

\- HD-1.1 Define the data model and API contract (`POST /tickets`).

\- HD-1.2 Implement the backend endpoint and persistence.

\- HD-1.3 Build the create form UI with client-side validation.

\- HD-1.4 Add unit/API tests (valid and invalid payloads).

\- HD-1.5 Add seed data script (5–8 sample tickets).



\### HD-2: List, search and filter tickets (P1, Must)

\*As an agent, I want to browse and filter tickets so that I can triage quickly.\*



\*\*Acceptance criteria\*\*

\- \*\*Given\*\* existing tickets, \*\*when\*\* I open the list, \*\*then\*\* I see id, title, status, priority and created date, newest first.

\- \*\*Given\*\* I choose a status or priority filter, \*\*then\*\* only matching tickets are shown.

\- \*\*Given\*\* I type a keyword, \*\*then\*\* tickets whose title or description contain it (case-insensitive) are shown.

\- \*\*Given\*\* no tickets match, \*\*then\*\* I see an "No tickets found" empty state.



\*\*Tasks\*\*

\- HD-2.1 Implement `GET /tickets?status=\&priority=\&q=\&sort=`.

\- HD-2.2 Build the list table UI.

\- HD-2.3 Add the filter and search controls with debounce.

\- HD-2.4 Add the empty and loading states.

\- HD-2.5 Add tests for filter combinations.



\### HD-3: View ticket details (P2, Must)

\*As an agent, I want to open a ticket so that I can see all of its information.\*



\*\*Acceptance criteria\*\*

\- \*\*Given\*\* a ticket in the list, \*\*when\*\* I click it, \*\*then\*\* I see all of its fields.

\- \*\*Given\*\* an invalid or non-existent id, \*\*when\*\* I navigate to it, \*\*then\*\* I see a "Ticket not found" page and the API returns 404.



\*\*Tasks\*\*

\- HD-3.1 Implement `GET /tickets/{id}`.

\- HD-3.2 Build the detail view and routing.

\- HD-3.3 Handle the 404 state.

\- HD-3.4 Add tests.



\### HD-4: Update ticket and manage status (P2, Must)

\*As an agent, I want to edit a ticket and change its status so that its state reflects the work.\*



\*\*Acceptance criteria\*\*

\- \*\*Given\*\* an open ticket, \*\*when\*\* I edit the title, description, priority or assignee and save, \*\*then\*\* the changes persist and `updatedAt` changes.

\- \*\*Given\*\* status `Open`, \*\*when\*\* I set it to `In Progress` or `Resolved`, \*\*then\*\* it is accepted.

\- \*\*Given\*\* status `Closed`, \*\*when\*\* I try to set it back to `Open`, \*\*then\*\* it is rejected with an error message.

\- \*\*Given\*\* invalid data, \*\*when\*\* I save, \*\*then\*\* field errors appear and nothing changes.



\*\*Tasks\*\*

\- HD-4.1 Define the status transition rules (confirmed at HITL #1).

\- HD-4.2 Implement `PUT/PATCH /tickets/{id}` with transition validation.

\- HD-4.3 Build the edit form and status dropdown (only valid next states).

\- HD-4.4 Add tests for valid and invalid transitions.



\### HD-5: Delete (retire) a ticket (P3, Should)

\*As an admin, I want to delete a ticket so that obsolete entries are removed safely.\*



\*\*Acceptance criteria\*\*

\- \*\*Given\*\* a ticket, \*\*when\*\* I click Delete, \*\*then\*\* a confirmation dialog appears.

\- \*\*Given\*\* I confirm, \*\*then\*\* the ticket is soft-deleted, disappears from the list, and `GET /tickets/{id}` returns 404.

\- \*\*Given\*\* I cancel, \*\*then\*\* nothing changes.



\*\*Tasks\*\*

\- HD-5.1 Implement `DELETE /tickets/{id}` (soft delete via a `deletedAt` flag).

\- HD-5.2 Exclude deleted tickets from the list and detail endpoints.

\- HD-5.3 Build the confirm dialog UI.

\- HD-5.4 Add tests.



\### HD-6: Validation, error handling and demo readiness (P3, Must, cross-cutting)

\*As a stakeholder, I want consistent errors and a stable demo so that the app looks reliable.\*



\*\*Acceptance criteria\*\*

\- \*\*Given\*\* any API error, \*\*then\*\* the response uses one JSON shape (`{code, message, fields?}`) with the correct HTTP status (400/404/500).

\- \*\*Given\*\* the backend is unreachable, \*\*then\*\* the UI shows a friendly error and does not crash.

\- \*\*Given\*\* a fresh clone, \*\*when\*\* I follow the README, \*\*then\*\* the app runs locally with seed data in under 5 minutes.

\- \*\*Given\*\* the test suite, \*\*then\*\* it passes in a single command.



\*\*Tasks\*\*

\- HD-6.1 Add a global error handler and error schema.

\- HD-6.2 Add a UI error boundary and toast notifications.

\- HD-6.3 Write the README (setup, run, test) and a demo script.

\- HD-6.4 Run a smoke test of the end-to-end demo path.

\- HD-6.5 Record known limitations (no auth, etc.).



\## 4. One-Day Plan with Human-in-the-Loop Checkpoints



| Time | Activity | HITL checkpoint |

|---|---|---|

| 0:00–0:30 | Review gap analysis and answer open questions | \*\*#1 Scope sign-off\*\* (status set, soft delete, stack) |

| 0:30–1:00 | Data model and API contract (HD-1.1, HD-4.1) | \*\*#2 Contract review\*\* before any code |

| 1:00–3:00 | HD-1, then HD-2 | \*\*#3 Review of the first vertical slice\*\* (create + list working) |

| 3:00–5:00 | HD-3, then HD-4 | \*\*#4 Review of transition rules and tests\*\* |

| 5:00–6:30 | HD-5, then HD-6 | \*\*#5 Review before merge\*\* (diff, tests green) |

| 6:30–7:30 | Smoke test and demo rehearsal | \*\*#6 Go/no-go for the demo\*\* |



\*\*Cut line if time slips:\*\* drop HD-5 first (Should), then trim HD-2 to filter-only. HD-1, HD-3, HD-4 and HD-6 are not negotiable.



\*\*Risks:\*\* the stack is unconfirmed, there is no auth, soft delete may conflict with stakeholder expectations, and the scope has little slack.

