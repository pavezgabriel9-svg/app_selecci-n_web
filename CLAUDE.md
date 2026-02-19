# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run as web server only (development)
npm start

# Run as Electron desktop app
npm run electron

# Build macOS distributable
npm run dist
```

There is no test runner or linter configured. `webpack.config.js` exists in the root but is not referenced by any npm script — treat it as an unused artifact.

## Architecture

This is an Electron desktop app that embeds an Express.js web server. `main.js` starts the Express server (`server.js`) and opens a `BrowserWindow` pointing to `http://localhost:3000`.

### Two Modes

- **Development** (`npm start`): Runs Express standalone; `data/` folder is read from the project root.
- **Production** (`npm run electron`): Electron sets `USER_DATA_PATH` (via `app.getPath('userData')`) and the server copies data files there on first launch.

### Data Layer

There are two separate data stores:

1. **Server-side JSON** (`data/tests.json`, `data/baterias.json`): Stores the test catalog and saved batteries. Managed via the REST API (`GET/POST/DELETE /api/baterias`, `GET /api/tests`). In `tests.json`, the `path` field is just the HTML filename (e.g. `"hanoi-medio.html"`); `TestNavigation` prepends `/tests/` when navigating.

2. **Browser `localStorage`**: Stores everything related to candidate sessions and test results. Results are never sent to the server — they live only in the browser. Key localStorage entries:
   - `selectedTests` — ordered array of tests to run
   - `currentTestIndex` — index into `selectedTests` for the active test
   - `usuario` — `{ nombreUsuario, rut, fechaRegistro }` (fechaRegistro acts as session ID)
   - `testSessions` — array of all completed sessions with embedded results
   - Practice-phase flags: `hanoiPracticeCompleted`, `hanoiDificilPracticeCompleted`, `memoriaPracticeCompleted`, `stroopPracticeCompleted`

### User Flow

1. **Admin** (`/index.html` + `public/script.js`): Selects individual tests or a saved battery, clicks "Aplicar Evaluación" → saves `selectedTests` to localStorage. Note: `script.js` lives at `public/script.js`, not in `public/js/`.
2. **Candidate** (`/inicio.html`): Enters name and RUT → saved as `usuario` in localStorage → redirected to first test at `/tests/<path>`.
3. **Tests** (`/tests/*.html` + `public/js/*.js`): Each test runs independently. On completion, it calls `TestNavigation.completeCurrentTest(results, 'resultadosXxx')` to save results and advance to the next test.
4. **Results** (`/results.html` + `public/js/results.js`): Reads all sessions from `localStorage.testSessions`. Supports table/excel-style views, search by name/RUT, CSV download, and delete.

### TestNavigation (`public/js/navigation.js`)

Central coordinator for the test sequence. Exposed as `window.TestNavigation`. Key methods:

- `validateSession()` — redirects to `/` if no valid session exists; call on `DOMContentLoaded`.
- `completeCurrentTest(results, nombrePrueba)` — saves results under `session[nombrePrueba]`, increments `currentTestIndex`, navigates to next test or to `/thank-you.html`.
- `completeLuscher(luscherData)` — special handler for Lüscher (spans 4 pages). Saves all four sub-results atomically and cleans up temp keys.

### Available Tests

Tests in `data/tests.json`:
- **Hanói Medio / Difícil** — Tower of Hanoi cognitive test (two difficulty variants)
- **IC** — Inventario de Capacidades (capacity inventory); the largest test (`ic.html` / `ic.js`)
- **Memoria** — Memory test
- **Stroop** — Stroop color-word interference test
- **Lüscher** — Color preference personality test (4-page sequence)

### Lüscher Test (Special Case)

Lüscher spans four sequential pages: `luscher-grises.html` → `luscher-colores1.html` → `luscher-formas.html` → `luscher-colores2.html`. The first three pages save partial results to temp keys (`resultadosLuscherG`, `resultadosLuscher8.1`, `resultadosLuscherF`). Only the last page (`luscher-colores2.js`) calls `TestNavigation.completeLuscher()` which bundles all four sub-results and advances the sequence. Note: temp key `resultadosLuscher8.1` becomes the permanent key `resultadosLuscher81` (dot removed) in the saved session.

### Tests with Practice Phases

Hanói (both versions), Stroop, and Memoria each have a practice HTML page that runs first. Navigation from the practice page to the real test is handled within the individual test's JS file (using the practice-phase localStorage flags), not through `TestNavigation`.

### Known Bugs in `server.js`

1. **`POST /api/baterias`** (line 83): `newBattery.id` is assigned before `newBattery` is declared on line 84, causing a ReferenceError. The `id` set on line 83 is also immediately overwritten on line 89. Fix: remove line 83 entirely.

2. **Route registration order**: `app.listen()` is called on line 64, before most routes (lines 69+) are registered. This works in practice because Node.js routes are registered synchronously before any request arrives, but it is non-standard and confusing.
