# Task Manager

A small React task manager built from the [KAN implementation plan](implementation_plan.md): search and status filter, validated forms, timestamps with safe `localStorage` migration, an undo-able delete (5-second snackbar), and keyboard/screen-reader support.

## Prerequisites

- Node.js 20 or newer (CI uses Node 22)
- npm

## Setup and run

```bash
cd frontend
npm ci          # install exact locked dependencies
npm run dev     # start the dev server (http://localhost:5173)
```

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run lint` | ESLint |
| `npm test` | Run the Vitest suite once |
| `npm run build` | Production build into `frontend/dist` |

CI (`.github/workflows/ci.yml`) runs exactly `npm ci`, `lint`, `test`, `build` in `frontend/`. Run the same four commands locally before opening a PR.

## Usage

- **Add / edit**: title is required (3-100 characters after trimming); description is optional. Errors appear next to the field and are announced to screen readers. Press `Esc` to cancel an edit.
- **Search**: case-insensitive "contains" match on title and description.
- **Filter**: by status (All, To do, In progress, Done). Search and filter combine with AND. "Clear filters" resets both.
- **Delete**: removes the task immediately and shows an "Undo" snackbar for 5 seconds; Undo restores the task at its original position and focuses it. After a delete, focus moves to the next task (or the page heading if the list is empty).
- **Timestamps**: every task has `createdAt` and `updatedAt` (ISO-8601). Any edit, including a status change, updates `updatedAt`.

## Data and migration

Tasks live in `localStorage` under `task-manager.tasks.v2`. Older data (keys `task-manager.tasks` or `tasks`, or tasks without timestamps) is migrated on load: missing `createdAt` is set to the migration time, `updatedAt` defaults to `createdAt`, and the result is saved once. Corrupt data never crashes the app; a banner explains what happened and the list starts empty.

## Demo script

1. Add "Write report" with a description; see it appear with a created time.
2. Submit an empty title; see the inline error and focus return to the field.
3. Search for a word from the description; the list narrows. Pick a status filter; the list narrows further.
4. Edit the task and change its status; "Updated" time appears.
5. Delete it with the keyboard only (Tab to Delete, Enter); focus moves on. Tab to "Undo" within 5 seconds to restore it.

## Manual accessibility checklist

- Every control is reachable with Tab and has a visible focus outline.
- Submitting an empty/invalid title focuses the Title field; the error is read out and linked via `aria-describedby`.
- Opening Edit focuses the Title field; Esc cancels and focus returns to Edit.
- Deleting announces "deleted. Undo available."; Undo announces "restored." and focuses the task.

## Troubleshooting

- **Reset saved data**: in the browser console run `localStorage.removeItem('task-manager.tasks.v2')`, then reload.
- **"Changes could not be saved" banner**: browser storage is full or blocked (private mode). Free space or allow site storage.
- **`npm ci` fails**: make sure `frontend/package-lock.json` is committed and your Node version is 20+.
- **Tests fail on a fresh clone**: delete `frontend/node_modules` and run `npm ci` again.
