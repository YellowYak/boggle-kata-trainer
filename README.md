# Boggle Katas

A browser-based Boggle practice app. A **Boggle kata** is a short, focused exercise — inspired by the martial arts concept of *kata* (form) — designed to build muscle memory for spotting words in a Boggle grid.

## Features

- **Configurable grid sizes** — 2×2, 2×3, 3×3, or 4×4
- **Number of solutions** — Random, Few Words, or Many Words; thresholds scale with grid size (e.g. Few Words is 1–2 on 2×2, 2–5 on 3×3, 2–9 on 4×4)
- **Minimum word length** — 3, 4, 5, or 6 letters
- **Adjustable timer** — 15, 30, or 60 seconds, or Untimed (no countdown; end manually or by finding every word)
- **Real-time path validation** — grid cells highlight as you type, turning green for a valid path and red when a letter can't be reached
- **Touch input** — tap grid tiles in sequence to build a word without triggering the on-screen keyboard; use ⌫ to remove the last tapped tile
- **Word history navigation** — press ↑/↓ to cycle through previously submitted words, like a terminal
- **Post-game review** — see every word you found and every word you missed, each linking to its dictionary.com entry
- **Standard Boggle scoring** — 1 pt (3–4 letters), 2 pt (5), 3 pt (6), 5 pt (7), 11 pt (8+)
- **TWL word list** — validated against the Tournament Word List (~178,000 words)
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
    ├── twl.txt             # TWL word list (one word per line)
    └── favicon.svg         # SVG favicon (2×2 Boggle tile grid)
```

## How to Run

The app uses ES modules and `fetch`, so it must be served over HTTP — opening `index.html` directly as a `file://` URL will not work.

**VS Code Live Server** — install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, then right-click `index.html` → **Open with Live Server**.

**Node.js**

```bash
npx serve .
```

**Python**

```bash
python -m http.server 8080
```

## Gameplay

1. Choose a **grid size**, **number of solutions**, **minimum word length**, and **duration** on the setup screen.
2. Click **Start Kata** — a grid is generated and the countdown begins (or play begins immediately if Untimed).
3. Enter words by typing and pressing **Enter**, or by tapping tiles on the grid.
   - Green input border = valid path through the grid so far.
   - Red input border = letter can't be reached from the previous tile.
4. Use **↑ / ↓** arrow keys to recall previously typed words.
5. When time runs out (or you click **End Game**), the results screen shows your score, the words you found, and the words you missed.
6. **Play Again** reuses the same settings; **Change Settings** returns to setup.

## Key Algorithms

**Grid generation** — Shuffles the 16 standard Boggle dice and picks a random face from each. Builds an 8-directional adjacency map (cell index → neighboring cell indices) used by all DFS routines.

**Word solving** — Loads the TWL word list into a trie for fast prefix pruning. Runs DFS from every starting cell; branches are cut as soon as the current letter sequence is not a prefix of any word in the trie.

**Real-time validation** — As the player types, a DFS checks whether the typed string can be traced as a connected, non-repeating path through the grid. Complete paths are used for green highlighting; the deepest partial path reached is used for red highlighting.

**Difficulty filtering** — Grid generation retries up to 200 times until the solved word count falls within the range for the selected difficulty mode, with a final fallback to guarantee at least one valid word.
