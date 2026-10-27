# Implementation Plan — Task Manager Enhancements (KAN)

## Planning Summary
This plan covers the approved Task Manager enhancement stories focused on usability (search/filter, delete UX, empty states), data quality (validation, timestamps + migration), accessibility (keyboard + focus + accessible validation), and engineering enablement (CI, tests, README, error handling). It provides a sequenced roadmap, task breakdown with dependencies, risks, and delivery checkpoints.

**In-scope Jira stories referenced in this plan**
- **KAN-165** — CI pipeline and code quality gates
- **KAN-166** — Search & status filter behavior
- **KAN-167** — Title validation rules (required + length + trimming)
- **KAN-168** — Task timestamps (createdAt/updatedAt) + localStorage migration
- **KAN-169** — Improved delete experience
- **KAN-170** — Accessibility acceptance criteria (keyboard, focus, accessible validation)
- **KAN-33** — Cross-cutting: error handling, UX polish, README + demo script, tests
- **KAN-142** — README update (setup/run/test/usage)

> Note: This is an implementation plan only. It does not modify application source code.

---

## 1. Delivery Approach

### 1.1 Guiding principles
- **Ship in thin vertical slices**: implement storage/model changes early (timestamps/migration), then UX capabilities (search/filter, delete), then accessibility pass, then engineering hardening.
- **Minimize regression risk** by introducing a small storage/migration layer and adding tests before large UI refactors.
- **Accessibility built-in**: design keyboard/focus behavior as part of each UI change; do not postpone to the end.

### 1.2 Definition of Done (DoD) for each story
- Acceptance Criteria met (per Jira).
- Automated checks pass locally and in CI (once KAN-165 lands).
- No app crash on invalid/legacy `localStorage` data.
- Keyboard-only flow supports create/edit/search/filter/delete.
- README updated to reflect new commands and behaviors.

---

## 2. Implementation Roadmap (Sequenced)

### Milestone M0 — Planning / alignment (0.5 day)
- Confirm/lock decision points in KAN-166/167/169/168/170 (see §6.1).
- Confirm CI target platform and node version for KAN-165.

### Milestone M1 — Engineering foundation (1–2 days)
**Primary stories:** KAN-165, KAN-33 (partial), KAN-142 (partial)
- Add CI workflow(s) and code quality gates.
- Establish testing command baseline and scaffolding (unit/integration minimal).
- Begin README improvements for setup/run/test.

### Milestone M2 — Data model + persistence (1–2 days)
**Primary story:** KAN-168, KAN-33 (error handling)
- Implement timestamps and localStorage migration + robust parsing.
- Add error boundary + friendly message pattern.
- Add tests for migration and storage failure scenarios.

### Milestone M3 — Core UX: search/filter + empty states (1–2 days)
**Primary stories:** KAN-166, KAN-33 (UX polish)
- Implement search (title/description) and status filter.
- Implement empty states for (a) no tasks, (b) no results.
- Add tests for search/filter behavior.

### Milestone M4 — Validation + accessible forms (1–2 days)
**Primary stories:** KAN-167, KAN-170, KAN-33 (standardize errors)
- Enforce title validation in create/edit.
- Provide field-level error messages and accessible attributes.
- Add tests for validation and keyboard interactions.

### Milestone M5 — Delete UX + focus management (1–2 days)
**Primary stories:** KAN-169, KAN-170
- Implement improved delete interaction (confirm or undo).
- Ensure focus management and keyboard support.
- Add tests for delete flow and focus restoration.

### Milestone M6 — Hardening, documentation finalization, closure (0.5–1 day)
**Primary stories:** KAN-33, KAN-142
- Finalize README, demo steps, troubleshooting.
- Ensure CI stable and deterministic.
- Final regression pass via tests.

---

## 3. Detailed Task Breakdown

### 3.1 KAN-165 — CI pipeline and code quality gates
**Goal:** Deterministic automation of lint/test/build.

**Tasks**
1. Select CI platform and baseline configuration
   - Choose GitHub Actions (or existing CI platform if already mandated).
   - Pin Node version(s) (e.g., latest LTS) and package manager behavior (`npm ci`).
2. Implement CI pipeline
   - Job steps: checkout → install → lint → test → build.
   - Cache dependencies where safe.
   - Ensure failure on any step.
3. Add code quality tooling alignment
   - Confirm available scripts: `lint`, `test`, `build`.
   - If scripts missing, add them (planned in dev work; not in this plan execution).
4. Document in README (handoff to KAN-142)
   - “How to run the same checks locally.”

**Dependencies**
- None.

**Risks**
- Flaky CI due to unpinned Node versions or inconsistent lockfiles.

---

### 3.2 KAN-168 — Timestamps + localStorage migration
**Goal:** Add `createdAt`/`updatedAt` and safely migrate legacy tasks.

**Tasks**
1. Define task model update
   - Add fields: `createdAt`, `updatedAt`.
   - Choose timestamp format (recommended: ISO-8601 strings).
2. Implement storage schema migration
   - On load: parse tasks; if parse fails, recover gracefully (empty list + warning UI).
   - For tasks missing timestamps:
     - Set `createdAt` to a derived value (e.g., current time at migration) per decision.
     - Set `updatedAt` equal to `createdAt`.
   - Persist migrated result back to `localStorage` once.
3. Define update rules
   - On create: set both timestamps.
   - On edit: update `updatedAt`, preserve `createdAt`.
   - Clarify whether status change counts as edit (see §6.1).
4. Add tests
   - Migration of legacy tasks (missing fields).
   - Corrupt JSON handling.
   - Ensure no crash and data preserved.

**Dependencies**
- Should land before KAN-166/167/169 to ensure list operations work with new model.

**Risks**
- Breaking existing stored data; mitigation: migration + defensive parsing.

---

### 3.3 KAN-166 — Search & status filter
**Goal:** Users can search by title/description and filter by status.

**Tasks**
1. Confirm search + filter behavior
   - Case-insensitive matching.
   - Partial (“contains”) match.
   - Combine search and status filter using AND.
   - Decide whether a single search box searches both title + description.
2. Implement UI controls
   - Search input (with optional debounce).
   - Status filter (dropdown/tabs) with “All”.
   - Clear controls (clear search, reset filter).
3. Implement filtering logic
   - Apply to task list source of truth.
   - Ensure stable behavior with timestamps/migrated data.
4. Empty states
   - No tasks yet → primary CTA to create.
   - No results for current search/filter → clear filters CTA.
5. Add tests
   - Search by title.
   - Search by description.
   - Status filtering.
   - Combined behavior.

**Dependencies**
- Depends on KAN-168 for stable model/persistence (recommended).

**Risks**
- Ambiguity in behavior can lead to rework; mitigate by locking decisions early.

---

### 3.4 KAN-167 — Title validation improvements
**Goal:** Title required + length constraints + clearer field-level messages.

**Tasks**
1. Lock validation rules
   - Required after trimming.
   - Min/max length (values must be explicitly set).
2. Implement validation (create + edit)
   - Block save on invalid state.
   - Provide clear messages per rule.
3. Standardize errors pattern (align with KAN-33)
   - Field-level errors consistently rendered.
   - Optional error summary if required.
4. Add tests
   - Required title prevents submit.
   - Too short/too long messages.
   - Edit flow respects same rules.

**Dependencies**
- Works best after KAN-168 (migration) to avoid invalid legacy tasks breaking edit.

**Risks**
- Legacy tasks may violate new rules; mitigation: migration strategy or “validate on edit” strategy.

---

### 3.5 KAN-169 — Improved delete experience
**Goal:** Safer, clearer deletion with correct keyboard/focus behavior.

**Tasks**
1. Choose delete UX pattern
   - Confirmation dialog OR undo toast.
   - Define escape key behavior and focus restoration.
2. Implement delete flow
   - Trigger via mouse and keyboard.
   - Post-delete focus placement (next logical item).
3. Add tests
   - Delete a task from list.
   - Delete while in edit mode.
   - Undo (if implemented).

**Dependencies**
- Depends on KAN-170 focus management guidance for consistent behavior.

**Risks**
- Focus bugs and keyboard traps; mitigate with explicit focus plan and tests.

---

### 3.6 KAN-170 — Accessibility acceptance criteria
**Goal:** Keyboard navigation, focus management, accessible validation.

**Tasks**
1. Create accessibility checklist (story deliverable)
   - Keyboard-only primary flows.
   - Focus order and visible focus.
   - Form field labeling.
   - Error announcement strategy.
   - Modal behavior (focus trap, ESC, restore focus).
2. Apply checklist across features
   - Search/filter controls accessible (labels, roles).
   - Validation errors: `aria-invalid`, `aria-describedby`.
   - Delete dialog/toast focus behavior.
3. Add accessibility tests (as feasible)
   - Basic keyboard navigation tests.
   - Automated accessibility linting/tooling if available.

**Dependencies**
- Informs implementation of KAN-167 and KAN-169.

**Risks**
- Overly broad definition; mitigate by keeping checklist minimal but testable.

---

### 3.7 KAN-33 — Cross-cutting: error handling, UX polish, tests, README + demo script
**Goal:** Make the app stable and demo-ready.

**Tasks**
1. Error handling
   - Add global error boundary.
   - Handle storage read/write failures gracefully.
2. UX polish
   - Consistent empty states.
   - Consistent error display.
3. Tests
   - Expand tests for main flows and edge cases.
   - Ensure single-command run.
4. Documentation
   - Short demo steps.
   - Troubleshooting (clear localStorage/reset instructions).

**Dependencies**
- Touches all feature stories; should be ongoing across milestones.

**Risks**
- Scope creep; mitigate by tying each change to a specific acceptance criterion.

---

### 3.8 KAN-142 — README update
**Goal:** Ensure a fresh clone can run in <5 minutes and contributors know how to validate changes.

**Tasks**
1. Setup & run instructions
   - Prerequisites (Node version).
   - Install, dev server, build, test, lint.
2. Usage overview
   - Creating/editing tasks, search/filter, delete behavior.
3. Troubleshooting
   - Reset localStorage.
   - Common CI/test issues.
4. Demo script
   - 5-step walkthrough verifying key features.

**Dependencies**
- Depends on final decisions for UX behavior.

---

## 4. Dependency Graph (Summary)

- **KAN-165 (CI)** → supports and validates all subsequent work.
- **KAN-168 (timestamps + migration)** → prerequisite for stable list operations and reduces regression risk for KAN-166/167/169.
- **KAN-170 (a11y checklist)** → informs KAN-167 (validation) and KAN-169 (delete UX) and should be started early.
- **KAN-33 (cross-cutting)** → executed incrementally across milestones.
- **KAN-142 (README)** → finalize after behaviors are implemented, but start early with baseline setup.

Recommended sequence: **KAN-165 → (KAN-170 checklist draft) → KAN-168 → KAN-166 → KAN-167 → KAN-169 → KAN-33 hardening → KAN-142 finalize**.

---

## 5. Test Strategy (planned work items)

### 5.1 Test layers
- **Unit tests**: storage/migration, search/filter functions, validation rules.
- **Component/integration tests**: create/edit flows, delete interactions, empty state rendering.
- **E2E (optional if already present)**: smoke path for demo readiness.

### 5.2 Minimum regression suite
- Load app with empty `localStorage` → app stable.
- Load app with corrupt tasks JSON → app shows friendly error, does not crash.
- Create task with valid title → appears in list.
- Create/edit task with invalid title → blocked with accessible error.
- Search tasks by title/description → list updates.
- Filter by status → list updates.
- Delete task (and undo/confirm) → behaves as specified.

---

## 6. Key Decisions Needed (to prevent rework)

### 6.1 Decisions to confirm during M0
1. **Search behavior**
   - Case-insensitive? partial match? debounce duration?
   - Single box for title+description vs separate controls?
2. **Status filter**
   - Status values and default selection.
3. **Validation constraints**
   - Title min/max length and error copy.
   - When to show validation (on submit vs on blur vs live).
4. **Delete UX**
   - Confirm dialog vs undo toast; undo window duration.
5. **Timestamps update rules**
   - Whether status change updates `updatedAt`.
   - How to set timestamps for legacy tasks.
6. **Accessibility checklist scope**
   - Modal requirements (focus trap/ESC/restore focus).

---

## 7. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---:|---:|---|
| localStorage schema change breaks existing users | High | Medium | Defensive parsing + migration + tests (KAN-168, KAN-33) |
| Ambiguous UX (search/filter/delete) causes rework | Medium | High | Lock decisions in M0; document in stories |
| Accessibility regressions (focus traps, keyboard dead ends) | High | Medium | Accessibility checklist early (KAN-170) + keyboard tests |
| CI flakiness | Medium | Medium | Pin Node version, deterministic installs, keep workflow minimal (KAN-165) |
| Scope creep in “code quality improvements” | Medium | Medium | Tie changes to CI gates and explicit acceptance criteria |

---

## 8. Implementation Checklist (Operational)

- [ ] M0: Confirm decisions in §6.1 and update story notes.
- [ ] M1: CI green on PR; baseline README setup/test commands added.
- [ ] M2: Timestamps + migration + storage error handling; tests added.
- [ ] M3: Search/filter + empty states; tests added.
- [ ] M4: Validation + accessible error messaging; tests added.
- [ ] M5: Delete UX + focus behavior; tests added.
- [ ] M6: README finalized; demo steps validated; regression suite green.

---

## 9. Deliverables
- `implementation_plan.md` (this document)
- CI workflow and code changes (to be delivered in subsequent development stories; not part of this plan-only branch)

