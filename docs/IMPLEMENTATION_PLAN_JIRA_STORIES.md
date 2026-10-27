# Implementation Plan — Task Manager Enhancements (Approved Jira Stories)

This plan implements the approved Jira stories:
- **KAN-165** — CI pipeline + code quality gates
- **KAN-167** — Title validation rules (required + length + trimming)
- **KAN-168** — Task timestamps + localStorage migration
- **KAN-169** — Delete UX improvements (confirm/undo) + focus behavior
- **KAN-170** — Accessibility acceptance criteria (keyboard, focus, accessible validation)

> Constraints: Frontend-only React + Vite app. Persistence remains **localStorage**. No auth, no backend APIs.

---

## 1. Goals and Deliverables

### 1.1 Product goals
- Reduce user errors with clear, accessible validation.
- Improve trust and auditability via `createdAt`/`updatedAt` timestamps.
- Reduce accidental deletions and ensure predictable focus behavior.
- Ensure the app is usable with keyboard-only navigation and is screen-reader friendly.
- Improve engineering reliability with CI checks and consistent quality gates.

### 1.2 Deliverables
- Updated task data model with timestamps and a migration path.
- Enhanced task form validation (title required, length constraints, trimming).
- Improved delete workflow (confirmation or undo) with accessible focus management.
- Accessibility improvements across forms and interactive controls.
- CI workflow executing install/lint/test/build.
- README updates describing scripts and quality gates.

---

## 2. Assumptions and Decisions to Lock Early

These items are required to avoid rework.

### 2.1 Validation constraints (KAN-167)
- **Decision D1**: Title must contain **at least 1 non-whitespace character** after trimming.
- **Decision D2**: Title length constraints (recommendation):
  - `MIN_TITLE_LEN = 1`
  - `MAX_TITLE_LEN = 120`
  - Rationale: allows descriptive titles without encouraging long paragraphs.

> If the product owner specifies different limits, adjust constants and tests.

### 2.2 Timestamp format and update triggers (KAN-168)
- **Decision D3**: Store timestamps as **ISO-8601 strings in UTC** (e.g., `new Date().toISOString()`).
- **Decision D4**: `updatedAt` changes when any of these mutate:
  - title
  - description
  - status

### 2.3 Delete UX pattern (KAN-169)
- **Decision D5**: Choose one pattern; implement one consistently:
  - **Option A (recommended)**: **Undo toast/snackbar** (less interruption, fast workflows)
  - Option B: confirmation dialog

> If the current UI already uses dialogs, Option B may integrate better. This plan assumes **Option A** unless specified otherwise.

### 2.4 Accessibility baseline (KAN-170)
- **Decision D6**: Meet a pragmatic baseline aligned with **WCAG 2.1 AA practices** for:
  - keyboard operability
  - focus visible
  - label/role/name
  - error association/announcement
  - modal/dialog behavior (if used)

---

## 3. Architecture / Design Approach

### 3.1 Data model changes
Introduce a stable Task type (conceptual):
- `id: string`
- `title: string`
- `description?: string`
- `status: 'todo' | 'in-progress' | 'done'` *(or existing enum)*
- `createdAt: string` (ISO)
- `updatedAt: string` (ISO)

### 3.2 localStorage schema versioning
- Add a storage key version (e.g., `TASKS_SCHEMA_VERSION = 2`) OR implement tolerant migration without explicit versioning.
- Migration strategy:
  - On load, parse tasks.
  - For each task:
    - ensure `id`, `title`, `status` exist (or discard invalid items)
    - if `createdAt` missing: set to `nowISO`
    - if `updatedAt` missing: set to `createdAt`
  - Save normalized tasks back to localStorage.

### 3.3 Validation strategy
- Centralize validation in a utility:
  - `validateTask({title, ...}) -> { valid: boolean, errors: { title?: string } }`
- Trim input at save time (and optionally on blur) to ensure stored values are normalized.

### 3.4 Accessibility strategy
- Ensure each form control has an associated `<label>`.
- When invalid:
  - set `aria-invalid="true"`
  - render an error element with a stable id
  - set `aria-describedby` to include that error id
- On submit with errors, focus first invalid field.

### 3.5 Delete UX strategy (Undo)
- On delete action:
  - remove task from list immediately
  - show snackbar: “Task deleted” + “Undo” action for N seconds (e.g., 5s)
  - If undo clicked within window: restore task
  - If timeout: deletion becomes final (already removed)
- Focus behavior:
  - After delete: focus next logical item in list; fallback to list container; fallback to “Add task” button.
  - After undo: focus restored task’s action button (or row) if possible.

---

## 4. Work Breakdown Structure (WBS)

### Epic 0 — Project setup and discovery
**0.1** Confirm current code structure and where tasks/state are managed
- Identify task type, storage functions, and components for task list and task form.

**0.2** Lock decisions D1–D6 with stakeholders
- Document decisions in README or as constants in code.

---

### KAN-168 — Timestamps + localStorage migration (Foundational)
**Why first:** impacts task shape, sorting, future features, and avoids rework.

**Tasks**
1. Define/extend Task type to include `createdAt` and `updatedAt`.
2. Implement `nowISO()` helper.
3. Update “create task” flow to set:
   - `createdAt = nowISO()`
   - `updatedAt = createdAt`
4. Update “edit task” flow to update `updatedAt = nowISO()` when saved.
5. Update “status change” flow to also update `updatedAt`.
6. Implement load-time migration/normalization from localStorage:
   - parse
   - validate minimal required fields
   - backfill timestamps
   - persist normalized list
7. Add tests for migration and timestamp update triggers.

**Acceptance checks**
- Existing users with old tasks can load app with no runtime errors.
- New tasks always have both timestamps.
- Updating status updates `updatedAt`.

---

### KAN-167 — Title validation (required + length + trimming)
**Tasks**
1. Create validation constants: `MAX_TITLE_LEN`, etc.
2. Implement `trimAndNormalizeTitle(title)`.
3. Add validation logic:
   - empty after trim => error
   - length > max => error
4. Update create/edit forms to:
   - prevent submit if invalid
   - show field-level message near Title
   - set `aria-invalid` and `aria-describedby` when error present
5. Define when validation runs:
   - on submit (required)
   - optionally on blur for immediate feedback
6. Ensure title saved is trimmed.
7. Add unit/component tests:
   - whitespace-only fails
   - too-long fails
   - valid title saves trimmed value

**Acceptance checks**
- Cannot save invalid titles.
- Error messages are specific and consistent across create/edit.

---

### KAN-170 — Accessibility improvements (keyboard, focus, accessible validation)
**Tasks**
1. Keyboard navigation audit:
   - all interactive controls reachable by Tab
   - no custom elements without roles
2. Add visible focus styles where missing.
3. Form focus management:
   - on open create/edit UI, focus title input
   - on failed submit, focus first invalid field
4. Accessible validation:
   - ensure error text is linked via `aria-describedby`
   - ensure errors use `role="alert"` (or an aria-live region) if appropriate
5. If modals are used:
   - focus trap
   - ESC closes
   - return focus to invoking control
6. Add a11y-focused tests (where feasible) and manual checklist in README.

**Acceptance checks**
- Keyboard-only user can complete all core flows.
- Screen reader can identify invalid fields and associated error text.

---

### KAN-169 — Delete UX improvements (Undo or Confirm) + focus behavior
**Tasks (Undo pattern assumed)**
1. Implement delete action state:
   - store last deleted task + index
   - start undo timer
2. Add snackbar/toast UI with:
   - message text
   - Undo button
   - timer-based dismissal
3. Focus management rules:
   - after delete, move focus to next task row action; fallback list container
   - after undo, restore focus to restored task
4. Ensure it behaves correctly when list is filtered/searched (future-proof):
   - restoration respects current list order
5. Tests:
   - delete removes item
   - undo restores item
   - focus behavior (best-effort in component tests)

**Acceptance checks**
- Deletion is reversible within the configured window.
- Focus ends in a predictable location.

---

### KAN-165 — CI + code quality gates
**Tasks**
1. Confirm toolchain:
   - lint: ESLint
   - format: Prettier (optional but recommended)
   - tests: Vitest + React Testing Library (or existing)
2. Ensure `package.json` scripts exist:
   - `lint`
   - `test`
   - `build`
3. Add CI workflow (e.g., GitHub Actions):
   - checkout
   - setup node
   - npm ci
   - npm run lint
   - npm test
   - npm run build
4. Update README with local commands and CI description.

**Acceptance checks**
- CI fails when lint/test/build fail.
- CI runs on PRs and main branch pushes (per repo policy).

---

## 5. Dependencies

### Cross-story dependencies
- **KAN-168** is foundational for any ordering/sorting and consistent task updates.
- **KAN-167** should be implemented before **KAN-170** validation a11y completion (since a11y links depend on validation UI).
- **KAN-169** depends on a11y focus guidance from **KAN-170**.
- **KAN-165** can be implemented early, but it’s best after basic tests exist to avoid a “green but meaningless” pipeline.

### Recommended implementation order
1. **KAN-168** (timestamps + migration)
2. **KAN-167** (validation)
3. **KAN-170** (a11y + focus management)
4. **KAN-169** (delete UX + focus)
5. **KAN-165** (CI + quality gates + README updates)

---

## 6. Test Strategy

### 6.1 Automated tests
- **Unit tests**
  - validation functions (title rules)
  - migration/normalization from localStorage
- **Component tests**
  - create/edit form: error rendering, aria attributes, focus moves to invalid field
  - delete + undo flow

### 6.2 Manual test checklist (minimum)
- Create task with valid title; verify timestamps exist in storage.
- Attempt create/edit with whitespace title; verify error, focus, and screen reader discoverability.
- Change status; verify `updatedAt` changes.
- Delete a task; verify undo works; verify focus location.
- Keyboard-only completion of all flows.

---

## 7. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Unclear title length limits | Rework | Medium | Lock D2 early; keep constraints as constants + tests |
| Migration breaks for corrupted localStorage | Crash on load | Medium | Use safe parsing, schema guards, and ignore invalid entries |
| Focus management regressions with UI changes | Accessibility failures | Medium | Add helper functions + component tests; do manual keyboard runs |
| Delete undo complexity with filtered views | Incorrect restore | Low/Med | Store full task object + original index; restore robustly |
| CI introduces friction (flaky tests) | Team slowdown | Medium | Keep tests deterministic; mock timers for undo; avoid network |

---

## 8. Roadmap and Milestones

### Milestone M1 (Data integrity)
- Complete KAN-168 with migration + tests.

### Milestone M2 (Validation + A11y foundation)
- Complete KAN-167 and core parts of KAN-170 (error a11y + focus-first-invalid).

### Milestone M3 (Deletion UX)
- Complete KAN-169 with undo + focus behavior + tests.

### Milestone M4 (Engineering hardening)
- Complete KAN-165 CI workflow + README updates.

---

## 9. Definition of Done (DoD)
- All acceptance criteria for each Jira story are met.
- No runtime errors with existing localStorage data.
- Keyboard-only navigation supports all core flows.
- CI passes on PR and main branch (per configuration).
- README updated with scripts and quality gates.
