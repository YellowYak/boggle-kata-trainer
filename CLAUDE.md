# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

No build system or package manager — this is pure vanilla JavaScript with ES6 modules. Because ES modules require HTTP (not `file://`), serve with any local server:

- **VS Code Live Server** extension (recommended): right-click `index.html` → Open with Live Server
- **Python**: `python -m http.server 8080`
- **Node.js**: `npx serve .`

There are no tests, no linting config, and no build steps.

## Architecture

Multi-tool hub with three applications sharing a core set of JS modules:

- **`index.html`** — Landing page linking to all three tools
- **`katas.html` + `js/katas.js`** — Timed Boggle game (setup → play → results)
- **`solver.html` + `js/solver.js`** — Utility to solve any user-entered grid
- **`dictionary.html` + `js/dictionary.js`** — Browsable/searchable TWL word list with pagination

### Shared Core Modules (`js/`)

| Module | Role |
|---|---|
| `ui.js` | Shared UI helpers: loading overlay, button group wiring, `wordLink()` (generates dictionary.com anchor with score tooltip) |
| `gameState.js` | Central state (grid config, difficulty thresholds, scoring, found-words set) |
| `gridGenerator.js` | Loads dice from `assets/dice.txt`, shuffles, generates 2D grid via `generateGridCyclic`, builds 8-directional adjacency map |
| `wordSolver.js` | Loads TWL word list into a trie; DFS over grid to find all valid words |
| `wordValidator.js` | Real-time DFS as user types; returns complete/partial cell paths for live highlighting |

### Data Files (`assets/`)

- `dice.txt` — 16 standard Boggle dice (one die per line, 6 faces per line; `Q` = `Qu`)
- `twl.txt` — ~178,000-word Tournament Word List (one word per line, lowercase)

### Key Algorithms

- **Grid generation**: `generateGridCyclic` shuffles the 16 dice and picks a random face per cell; for grids larger than 16 cells (5×5, 6×6) the dice pool is reshuffled and drawn again without replacement until all cells are filled. Katas additionally retries up to 200× to satisfy difficulty word-count thresholds.
- **Word solving**: trie-pruned DFS from every cell; handles `Qu` as two-character trie key
- **Real-time validation**: incremental DFS per keystroke; green/red border reflects deepest partial match

### Word Links

`wordLink(word, cssClass)` in `ui.js` generates every dictionary.com anchor tag used across all three tools. Links include a `title="Score: X"` tooltip computed from `scoreWord()`. All three screens (katas results, solver results, dictionary browser) use this shared helper.

### Styling (`css/style.css`)

Single CSS file with CSS custom properties for theming (`--bg`, `--surface`, `--accent`, `--success`, `--danger`, etc.). Mobile-first, max-width 480px.

## Conventions

- **No external dependencies** — keep it dependency-free
- **ES6 modules** — use `import`/`export`; avoid global state
- **`Q` → `Qu`**: the letter `Q` is treated as `Qu` throughout grid generation, solving, and validation
- Difficulty word-count thresholds live in `gameState.js` and are scaled per grid size (2×2 through 6×6)
- Scoring follows standard Boggle rules (defined in `gameState.js`): 1 pt (3–4 letters), 2 pt (5), 3 pt (6), 5 pt (7), 11 pt (8+)
- Solver supports grid sizes 4×4, 5×5, and 6×6 (`SOLVER_SIZES` in `gameState.js`)
- Dictionary tool paginates results at 50 words per page and supports starts-with, contains, ends-with, and `_` wildcard search modes
