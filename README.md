# AI-Assistant-Driven SDLC Capstone

A simple full‑stack capstone with an API and a frontend UI for managing support tickets.

## Prerequisites

- Node.js (LTS recommended)
- npm (or yarn/pnpm)
- Git

## Install

From the repo root:

1. Install backend deps:
   - `cd server`
   - `npm install`

2. Install frontend deps:
   - `cd ../frontend`
   - `npm install`

## Running (Development)

### Run backend (server)

From repo root:

- `cd server`
- `npm run dev`

The server exposes ticket endpoints under:

- **API base:** `/api/tickets`

### Run frontend

From repo root:

- `cd frontend`
- `npm start`

### Run both (combined dev)

From repo root:

- `npm run dev`

## Tests

### Backend tests

From repo root:

- `cd server`
- `npm test`

### Frontend tests

From repo root:

- `cd frontend`
- `npm test`

## Seeded Data

The project includes seeded data to help you get started quickly. After starting the server, you should be able to fetch existing/seeded tickets via:

- `GET /api/tickets`