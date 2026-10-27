# Task Manager (KAN-9) — Final Project Documentation

## Project Overview
**Project:** Task Manager (Jira KAN-9)  
**Type:** Frontend-only React application (no backend, no auth)  
**Tech Stack:** React 18, Vite 5, Vitest, ESLint  
**Persistence:** `localStorage`  
**Repository:** https://github.com/gauravqait/codemie-agentic-sdlc-capstone (branch: `main`)

---

## Production & Local Development

### Production (Vercel)
**Production URL:** https://task-manager-capstone.vercel.app

### Local Development
From repo root:
```bash
cd frontend
npm ci
npm run dev
```

---

## Delivery / Repo Notes
- `main` was reset to an **Initial commit**.
- **PR #1** re-added the full app + story work including **KAN-169** (merged).
- **PR #2** added the implementation plan documentation (merged).
- Implementation plan is on `main` at:
  - `docs/IMPLEMENTATION_PLAN_JIRA_STORIES.md`

---

## Implemented Stories (Final)
### KAN-165 — CI
- GitHub Actions workflow runs in `frontend/`:
  - `npm ci`, lint, test, build
- Uses **Node 22**.

### KAN-166 — Search + Status Filter
- Case-insensitive “contains” search across **title + description**.
- Search and status filter are **ANDed**.
- Reset behavior included.
- Empty states supported.

### KAN-167 — Title Validation
- Title is required and must be **3–100 characters after trim**.
- Accessible field error:
  - focus moves to the invalid field
  - uses `aria-invalid` and `aria-describedby`
  - error messaging uses alert semantics

### KAN-168 — Timestamps + Storage Migration
- `createdAt` / `updatedAt` stored as ISO timestamps.
- Status changes bump `updatedAt`.
- Migration:
  - from legacy keys: `task-manager.tasks` and `tasks`
  - to new key: `task-manager.tasks.v2`
  - migration persisted once
- Corrupt storage data handled gracefully with a banner.

### KAN-169 — Delete with Undo (Final Shipped Behavior)
**Delete is immediate** (no confirm dialog). After delete:
- An **Undo snackbar** appears for an **8s window**.
- Timer **pauses on hover/focus** to support accessibility.
- Undo options:
  - Click Undo button
  - **Ctrl/Cmd+Z** triggers undo
- Dismiss:
  - **Esc** dismisses snackbar
- Undo behavior details:
  - Restores the deleted task at its **original position**
  - Focus is moved to the restored task
  - Only the **latest delete is undoable**
- Focus after delete (when not undone):
  - Moves to the next task if available, otherwise to the page heading
- Live region announcements:
  - “deleted. Undo available.”
  - “restored.”
- **Previous confirm-dialog (`alertdialog`) was removed** per plan decision **D5 Option A**.

### KAN-170 — Accessibility
- Labels for controls, keyboard operability, visible focus.
- Field validation semantics: `aria-invalid`, `aria-describedby`.
- Error presentation uses `role="alert"` where applicable.
- Polite live-region updates.

### KAN-33 — Reliability
- ErrorBoundary included.
- Storage failure banners.

### KAN-142 — README/Docs
- Documentation delivered in repo (including implementation plan).

---

## Architecture (High-Level)
- `App.jsx` as the main state container.
- `domain/`:
  - constants, validation, task logic, selectors
- `data/storage.js`:
  - load/save/migrate logic
- Components:
  - `TaskForm`
  - `TaskList`
  - `TaskControls`
  - `UndoSnackbar`
  - `LiveRegion`
  - `ErrorBoundary`

---

## Quality / Verification
- ESLint: clean
- Build: `vite build` OK (~153kB JS, ~2.2kB CSS)
- Tests: **40 Vitest tests passing** (40/40)
- CI “quality” check passed on PR #1.

---

## Process / Reviews Completed
- Development complete
- Code review complete (notable a11y fix: Undo made keyboard reachable within window via Ctrl/Cmd+Z and hover/focus pause)
- Testing review complete (40/40)
- Deployment-readiness review complete
- Deployed to Vercel production after merge.

---

## Known Limitations
- Title limits are **3–100** (plan suggested **1–120**).
- Only the **latest** delete is undoable.
- No real-browser / screen-reader manual test recorded.
- CodeMie code-review/test assistants were not reachable under this profile; steps were performed manually.

---

## Release Notes

### Release: Final Project State (KAN-9)
**What changed (notable):**
- Production deployment URL finalized: **https://task-manager-capstone.vercel.app**
- Delete UX finalized:
  - Removed confirm dialog
  - Immediate delete with accessible **Undo snackbar** (8s window, pause on hover/focus, Ctrl/Cmd+Z, Esc dismiss)
- Quality gate updated:
  - Test suite now **40 passing Vitest tests** (up from 35)

**Additional included scope (delivered as part of final state):**
- CI pipeline (Node 22; lint/test/build)
- Search + status filter
- Title validation + accessible errors
- Timestamps + storage migration + corrupt-data handling banner
- A11y improvements + reliability/error boundary
- Documentation and implementation plan on `main`

---

## Links
- Production app: https://task-manager-capstone.vercel.app
- Pull requests: #1 (app + KAN-169), #2 (implementation plan), and the documentation update
- Confluence page (to be synced): https://thegauravqa.atlassian.net/wiki/spaces/SD/pages/12550145/
