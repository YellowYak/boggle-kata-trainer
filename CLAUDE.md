# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

No build system or package manager — this is pure vanilla JavaScript with ES6 modules. Because ES modules require HTTP (not `file://`), serve with any local server:

- **VS Code Live Server** extension (recommended): right-click `index.html` → Open with Live Server
- **Python**: `python -m http.server 8080`
- **Node.js**: `npx serve .`

There are no tests, no linting config, and no build steps.

## Architecture

Multi-tool hub with two applications sharing a core set of JS modules:

- **`index.html`** — Landing page linking to both tools
- **`katas.html` + `js/katas.js`** — Timed Boggle game (setup → play → results)
- **`solver.html` + `js/solver.js`** — Utility to solve any user-entered grid

### Shared Core Modules (`js/`)

| Module | Role |
|---|---|
| `gameState.js` | Central state (grid config, difficulty thresholds, scoring, found-words set) |
| `gridGenerator.js` | Loads dice from `assets/dice.txt`, shuffles, generates 2D grid, builds 8-directional adjacency map |
| `wordSolver.js` | Loads TWL word list into a trie; DFS over grid to find all valid words |
| `wordValidator.js` | Real-time DFS as user types; returns complete/partial cell paths for live highlighting |

### Data Files (`assets/`)

- `dice.txt` — 16 standard Boggle dice (one die per line, 6 faces per line; `Q` = `Qu`)
- `twl.txt` — ~178,000-word Tournament Word List (one word per line, lowercase)

### Key Algorithms

- **Grid generation**: shuffle dice, pick random face each, retry up to 200× to satisfy difficulty thresholds
- **Word solving**: trie-pruned DFS from every cell; handles `Qu` as two-character trie key
- **Real-time validation**: incremental DFS per keystroke; green/red border reflects deepest partial match

### Styling (`css/style.css`)

Single CSS file with CSS custom properties for theming (`--bg`, `--surface`, `--accent`, `--success`, `--danger`, etc.). Mobile-first, max-width 480px.

## Conventions

- **No external dependencies** — keep it dependency-free
- **ES6 modules** — use `import`/`export`; avoid global state
- **`Q` → `Qu`**: the letter `Q` is treated as `Qu` throughout grid generation, solving, and validation
- Difficulty word-count thresholds live in `gameState.js` and are scaled per grid size
- Scoring follows standard Boggle rules (defined in `gameState.js`)
