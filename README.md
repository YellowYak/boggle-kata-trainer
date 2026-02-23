# Boggle Katas

A browser-based Boggle tool suite. The landing page links to three tools:

- **Boggle Katas** — a timed practice game; a *kata* is a short, focused exercise inspired by the martial arts concept of form, designed to build muscle memory for spotting words in a Boggle grid.
- **Boggle Solver** — enter any grid to instantly see every valid word it contains, with shareable URLs.
- **Word Dictionary** — browse and search all 178,000+ TWL words with text, length, and wildcard filters.

## Boggle Katas Features

- **Configurable grid sizes** — 2×2, 2×3, 3×3, 4×4, 5×5, or 6×6
- **Number of solutions** — Random, Few Words, or Many Words; thresholds scale with grid size (e.g. Few Words is 1–3 on 3×3, 1–5 on 4×4, 1–7 on 5×5, 2–10 on 6×6)
- **Minimum word length** — 3, 4, 5, or 6 letters
- **Adjustable timer** — 15 sec, 30 sec, 60 sec, 2 min, 3 min, or Untimed (no countdown; end manually or by finding every word)
- **Real-time path validation** — grid cells highlight as you type, turning green for a valid path and red when a letter can't be reached
- **Touch input** — tap grid tiles in sequence to build a word without triggering the on-screen keyboard; use ⌫ to remove the last tapped tile
- **Word history navigation** — press ↑/↓ to cycle through previously submitted words, like a terminal
- **Post-game review** — see every word you found and every word you missed, each linking to its dictionary.com entry; lists are sorted by score (highest first), then alphabetically
- **Standard Boggle scoring** — 1 pt (3–4 letters), 2 pt (5), 3 pt (6), 5 pt (7), 11 pt (8+)
- **TWL word list** — validated against the Tournament Word List (~178,000 words)
- **Authentic dice** — uses the 16 standard Boggle dice; *Q* is always treated as *Qu*

## Boggle Solver Features

- **Any grid size** — 4×4, 5×5, or 6×6
- **Configurable minimum word length** — 3, 4, 5, or 6 letters
- **Random Grid** — instantly fills the grid with a randomly generated Boggle layout using the authentic dice set; larger grids cycle through the 16 dice in additional shuffled passes
- **Word length breakdown** — results show a count of words found at each length before listing them
- **Shareable URLs** — after solving, the URL updates to encode the grid and settings (e.g. `solver.html?grid=ABCDEFGHIJKLMNOP&min=5`); loading a URL with those parameters auto-populates the grid and runs the solve immediately

## Word Dictionary Features

- **Paginated browsing** — displays 50 words per page across the full ~178,000-word TWL list
- **Text search with modes** — filter by *Starts with*, *Contains*, or *Ends with* a given string
- **Wildcard patterns** — use `_` as a single-letter wildcard (e.g. `c_t` matches *cat*, *cot*, *cut*); wildcard mode is auto-detected and overrides the text search modes
- **Word length filter** — set a minimum and/or maximum word length
- **Dictionary links** — every word links to its dictionary.com entry

## Project Structure

```
BoggleKatas/
├── index.html              # Landing page (tool hub)
├── katas.html              # Boggle Katas (setup / game / results screens)
├── solver.html             # Boggle Solver (enter grid, find all words)
├── dictionary.html         # Word Dictionary (browse & search the TWL)
├── css/
│   └── style.css           # Minimalist, mobile-first styles
├── js/
│   ├── katas.js            # Katas UI controller
│   ├── solver.js           # Solver UI controller; handles URL encode/decode
│   ├── dictionary.js       # Dictionary UI controller; filtering & pagination
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

**Live Demo**

https://yellowyak.github.io/boggle-kata-trainer/

## Boggle Katas Gameplay

1. Choose a **grid size**, **number of solutions**, **minimum word length**, and **duration** on the setup screen.
2. Click **Start Kata** — a grid is generated and the countdown begins (or play begins immediately if Untimed).
3. Enter words by typing and pressing **Enter**, or by tapping tiles on the grid.
   - Green input border = valid path through the grid so far.
   - Red input border = letter can't be reached from the previous tile.
4. Use **↑ / ↓** arrow keys to recall previously typed words.
5. When time runs out (or you click **End Game**), the results screen shows your score, the words you found, and the words you missed.
6. **Play Again** reuses the same settings; **Change Settings** returns to setup.

## Boggle Solver Usage

1. Choose a **grid size** and **minimum word length**.
2. Click **Random Grid** to populate the grid automatically, or fill in letters manually.
3. Click **Find Words**.
4. The URL updates to reflect the current grid and settings — bookmark or share it to return to the same grid later.

## Word Dictionary Usage

1. The full word list loads immediately, paginated 50 words at a time.
2. Type in the **Search** field to filter by prefix, substring, or suffix using the mode buttons.
3. Use `_` in the search field as a single-letter wildcard (e.g. `_qu_` for 4-letter words with *qu* in the middle); the mode buttons are ignored in wildcard mode.
4. Set **Min** and/or **Max** length to narrow results by word length.
5. Click any word to open its dictionary.com entry.

## Key Algorithms

**Grid generation** — Shuffles the 16 standard Boggle dice and picks a random face from each. For grids larger than 16 cells (5×5, 6×6), the dice set is reshuffled and cycled through additional passes until all cells are filled. Builds an 8-directional adjacency map (cell index → neighboring cell indices) used by all DFS routines.

**Word solving** — Loads the TWL word list into a trie for fast prefix pruning. Runs DFS from every starting cell; branches are cut as soon as the current letter sequence is not a prefix of any word in the trie.

**Real-time validation** — As the player types, a DFS checks whether the typed string can be traced as a connected, non-repeating path through the grid. Complete paths are used for green highlighting; the deepest partial path reached is used for red highlighting.

**Difficulty filtering** — Grid generation retries up to 200 times until the solved word count falls within the range for the selected difficulty mode, with a final fallback to guarantee at least one valid word.
