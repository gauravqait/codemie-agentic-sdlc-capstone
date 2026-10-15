# AI-Assistant-Driven SDLC Capstone

A lightweight capstone project intended to demonstrate an AI-assisted software development lifecycle (SDLC): requirements → implementation → validation via tests/CI. This repository is structured like a small product build, with a focus on maintainability, automation, and clear constraints.

## What this app is

A simple ticket-style CRUD app that stores items locally (via a file or embedded store, depending on the implementation in this repo) and enforces explicit content constraints:

- **Title**: max **100** characters
- **Description**: max **500** characters

> Note: `docs/requirements.md` is an **aspirational helpdesk ticket specification** used as a guiding document. It is **not fully implemented** and may include features that do not exist in the current codebase.

## Features

- Create, read, update, and delete ticket-like records
- Validation for:
  - required fields (as implemented)
  - title length ≤ 100 chars
  - description length ≤ 500 chars
- Local persistence (see **Storage behavior** below)
- Automated quality checks (lint/format/test) and CI support

## Storage behavior and constraints

This project uses **local storage** intended for development and demonstration purposes.

General expectations (verify exact details in the source code):
- Data is persisted locally in the repository workspace (or a configured path).
- Storage is **not designed for concurrent multi-process writes**.
- Storage is **not intended for production** usage.
- If storage is file-based:
  - deleting the storage file resets data
  - running tests may use a separate test data file/path to avoid clobbering dev data

If you need to change where data is stored, look for environment variables or configuration in the codebase (e.g., `.env`, config files, or constants).

## Project scripts

Run these from the repository root.

- **Install**
  - `npm install`

- **Development**
  - `npm run dev`  
    Starts the app in watch/development mode.

- **Test**
  - `npm test`  
    Runs the test suite.

- **Lint**
  - `npm run lint`  
    Runs static analysis checks.

- **Format**
  - `npm run format`  
    Formats the codebase.

- **Build**
  - `npm run build`  
    Produces a production build (if applicable for the stack used here).

If a script is missing in your local environment, check `package.json` for the definitive list of commands.

## CI

A CI pipeline is expected to run the same quality gates as local development, typically:
- install dependencies
- run lint
- run tests
- (optionally) run build

Check `.github/workflows/` for the exact CI workflow definitions and the commands executed.

## How to run locally

1. **Clone and install dependencies**
   - `git clone <repo-url>`
   - `cd <repo-folder>`
   - `npm install`

2. **Run the app**
   - `npm run dev`

3. **Run checks before committing**
   - `npm run lint`
   - `npm test`
   - `npm run format` (if you want to auto-format)

## Requirements document note

- `docs/requirements.md` describes a target/helpdesk-style spec and is meant to guide development discussions and future work.
- The current repository implementation may only cover a subset of that document.