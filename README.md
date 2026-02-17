# Boggle Practice

A browser-based Boggle word-finding trainer. Generate a letter grid, race against the clock to find as many words as possible, then review what you found and what you missed.

## Features

- **Configurable grid sizes** — 4×4 (classic), 3×3, or 3×2
- **Difficulty modes** — Random, Few Words (2–5), or Many Words (8+)
- **Adjustable timer** — 15, 30, or 60 seconds
- **Real-time path validation** — grid cells highlight as you type, turning green for a valid path and red when a letter breaks the chain
- **Word history navigation** — press ↑/↓ to cycle through previously submitted words, just like a terminal
- **Post-game review** — see every word you found alongside all the words you missed, with your final score
- **Standard Boggle scoring** — 1 pt (≤4 letters), 2 pt (5), 3 pt (6), 5 pt (7), 11 pt (8+)
- **TWL word list** — validated against the Tournament Word List (~180 k words)
- **Authentic dice** — uses the 16 standard Boggle dice; *Q* is always treated as *Qu*

## Project Structure

```
BoggleKatas/
├── index.html              # Main page (setup / game / results screens)
├── css/
│   └── style.css           # Minimalist, mobile-first styles
├── js/
│   ├── app.js              # UI controller — wires everything together
│   ├── gameState.js        # Central state, scoring, difficulty config
│   ├── gridGenerator.js    # Loads dice.txt, builds grids & adjacency maps
│   ├── wordSolver.js       # Trie-based solver, finds all valid words via DFS
│   └── wordValidator.js    # Real-time path validation as the user types
└── assets/
    ├── dice.txt            # 16 Boggle dice (6 faces each)
    └── twl.txt             # TWL word list (one word per line)
```

## How to Run

The app uses ES modules and `fetch`, so it must be served over HTTP — opening `index.html` directly as a `file://` URL will not work.

### Option 1 — VS Code Live Server (recommended)

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
2. Right-click `index.html` → **Open with Live Server**.

### Option 2 — Node.js `serve`

```bash
npx serve .
```

Then open the printed URL (usually `http://localhost:3000`) in your browser.

### Option 3 — Python

```bash
# Python 3
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Gameplay

1. Choose a **grid size**, **difficulty**, and **duration** on the setup screen.
2. Click **Start Game** — a grid is generated and the countdown begins.
3. Type words and press **Enter** (or tap the Enter button) to submit.
   - Green border = valid path through the grid so far.
   - Red border = letter breaks the path.
4. Use **↑ / ↓** arrow keys to recall previously typed words.
5. When time runs out, the results screen shows your score, the words you found, and the words you missed.
6. **Play Again** reuses the same settings; **Change Settings** returns to setup.
