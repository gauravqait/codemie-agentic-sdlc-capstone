# Enhancements & Changes Report — Task Manager (KAN-9)

| Story | Change | Review focus |
|---|---|---|
| KAN-165 | GitHub Actions CI on Node 22: install, lint, test, build | Triggers, `frontend/` working dir |
| KAN-166 | Case-insensitive search (title + description) combined with status filter; reset and empty states | Combined filter, empty state |
| KAN-167 | Title required, 3–100 chars after trim; focus on invalid field; `aria-invalid` / `aria-describedby` | Boundaries (2/3/100/101), screen reader |
| KAN-168 | `createdAt` / `updatedAt` timestamps; one-time migration to `task-manager.tasks.v2`; corrupt-storage banner | Migration with legacy data, no data loss |
| KAN-169 | Immediate delete (confirm dialog removed) with 8s Undo snackbar; Ctrl/Cmd+Z undo, Esc dismiss, timer pauses on hover/focus; task restored in place with focus | **Highest risk:** accidental deletes rely on Undo; shortcut vs text-field undo; focus handling |
| KAN-170 | Labels, keyboard operation, visible focus, `role="alert"` errors, polite live region | Keyboard and screen-reader walkthrough |
| KAN-33 | `ErrorBoundary` and storage-failure banners | Blocked or full `localStorage` |
| KAN-142 | README, implementation plan, final documentation | README matches shipped Undo behaviour |

Commits: `7ca9438` (app), `2cc10e2` (Undo keyboard and timer fix), `880c541` (plan), `fc676ba` (final docs).
