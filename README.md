# AI-Assistant-Driven SDLC Capstone

## Task Manager (Frontend)

The frontend is a lightweight Task Manager web app.

### Key features

- **CRUD**: create, read, update, and delete tasks
- **Filters & search**: quickly narrow down tasks by common criteria and free-text search
- **Validation**: client-side validation to prevent invalid task data
- **Persistence via `localStorage`**:
  - **Versioned state** stored under `taskManagerState` (includes a schema/state `version`)
  - **Migration support**: automatically migrates from the legacy `tasks` storage format/key into the current versioned state when detected

### Setup / development

From the repository root:

```bash
cd frontend
npm ci
npm run dev
```

### Testing

```bash
cd frontend
npm test
```

### Production build

```bash
cd frontend
npm run build
```

### localStorage notes

- **Current key**: `taskManagerState` (versioned)
- **Legacy key**: `tasks` (migrated automatically into `taskManagerState` when present)
