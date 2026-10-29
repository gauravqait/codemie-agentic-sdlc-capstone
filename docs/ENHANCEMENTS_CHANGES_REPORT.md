# 🚀 Enhancements & Changes Report

### Task Manager (Jira KAN-9) · React 18 · Vite 5 · Vitest · `localStorage`

> A frontend-only task manager, extended through 8 Jira stories. This report explains **what changed, why it matters, and what a reviewer should check.**

| 📦 Stories | ✅ Tests | 🔀 PRs merged | 🌐 Production |
|:---:|:---:|:---:|:---:|
| **8** | **40 / 40 passing** | **3** | [task-manager-capstone.vercel.app](https://task-manager-capstone.vercel.app) |

---

## ✨ What was enhanced

### 🔁 KAN-165 · Continuous Integration
**What:** A GitHub Actions workflow now runs in `frontend/` on every change: install → lint → test → build, on Node 22.
**Why:** Broken code is caught before it reaches `main`.
**Review:** Workflow triggers and the working directory.

### 🔍 KAN-166 · Search + Status Filter
**What:** Type to search tasks by title *or* description (case-insensitive). The search combines with the status filter, and a reset button clears both. Empty results show a friendly message.
**Why:** Finding a task in a long list is now instant.
**Review:** Combined search + filter results, and the empty state.

### ✅ KAN-167 · Title Validation
**What:** A title is required and must be **3–100 characters** after trimming spaces. On error, focus jumps to the field and the message is announced to screen readers (`aria-invalid`, `aria-describedby`).
**Why:** Blocks empty or junk tasks and keeps the form usable for everyone.
**Review:** Boundary values (2, 3, 100, 101 characters) and screen-reader output.

### 🕒 KAN-168 · Timestamps + Safe Storage Migration
**What:** Every task stores `createdAt` and `updatedAt` (ISO format), and changing a task's status updates `updatedAt`. Old saved data (`task-manager.tasks`, `tasks`) is migrated **once** to `task-manager.tasks.v2`. Corrupt stored data shows a banner instead of crashing.
**Why:** Existing users keep their tasks, and tasks now carry history.
**Review:** Migration with real legacy data (no data loss) and the corrupt-data banner.

### ↩️ KAN-169 · Delete with Undo ⚠️ *highest-risk change*

|  | Before | After |
|---|---|---|
| Delete | Confirm dialog first | **Deletes immediately** |
| Mistake? | Prevented by the dialog | **Undo snackbar for 8 seconds** |

**How Undo works:**
- Click **Undo** or press **Ctrl/Cmd + Z**; **Esc** dismisses the snackbar.
- The 8s timer **pauses on hover or focus**, so keyboard and slow users aren't rushed.
- The task returns to its **original position** and receives focus.
- Only the **latest** delete can be undone.
- If you don't undo, focus moves to the next task (or the page heading).
- Screen readers hear "deleted. Undo available." and "restored."

**Why:** Faster workflow with a safety net. The confirm dialog was removed on purpose (decision D5 Option A).
**Review:** Accidental deletes now rely on Undo; check that the Ctrl/Cmd+Z shortcut doesn't interfere with undo inside text fields, and check focus handling.

### ♿ KAN-170 · Accessibility
**What:** Labelled controls, full keyboard operation, visible focus, `role="alert"` for errors, and polite live-region announcements.
**Why:** The app works with keyboard-only and screen-reader use.
**Review:** A keyboard-only and screen-reader walkthrough.

### 🛡️ KAN-33 · Reliability
**What:** An `ErrorBoundary` catches rendering crashes, and banners report storage failures.
**Why:** The app fails gracefully rather than showing a blank page.
**Review:** Behaviour when `localStorage` is blocked or full.

### 📝 KAN-142 · Documentation
**What:** README, implementation plan and final documentation.
**Review:** README matches the shipped Undo behaviour.

---

## 🧩 How the code is organised

```
frontend/src
├── App.jsx            state container
├── domain/            constants · validation · tasks · selectors
├── data/storage.js    load · save · migrate
└── components/        TaskForm · TaskList · TaskControls
                       UndoSnackbar · LiveRegion · ErrorBoundary
```

## 🧾 Commits

| Commit | What it did |
|---|---|
| `7ca9438` | Built the app with all stories, including Undo delete |
| `2cc10e2` | Review fix: Undo reachable by keyboard, timer pauses on hover/focus, extra tests |
| `880c541` | Added the approved implementation plan |
| `fc676ba` | Updated the final documentation to the shipped state |
