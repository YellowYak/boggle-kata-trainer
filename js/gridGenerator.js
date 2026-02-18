/**
 * gridGenerator.js
 * Loads dice config from assets/dice.txt and generates Boggle grids.
 * 'Q' on a die face is treated as 'Qu' throughout.
 */

let DICE = null; // Array of arrays, each inner array has 6 letter strings

export async function loadDice() {
  if (DICE) return DICE;
  const resp = await fetch('assets/dice.txt');
  const text = await resp.text();
  DICE = text.trim().split('\n').map(line => {
    // Each line is like "AACIOT" — split into individual chars
    // 'Q' becomes 'Qu'
    return line.trim().split('').map(ch => ch === 'Q' ? 'Qu' : ch);
  });
  return DICE;
}

/**
 * Generate a grid of size rows×cols.
 * Returns a 2D array (rows×cols) of letter strings.
 * Each cell is a letter string (possibly 'Qu').
 */
export function generateGrid(rows, cols) {
  if (!DICE) throw new Error('Dice not loaded. Call loadDice() first.');
  const count = rows * cols;
  if (count > DICE.length) {
    throw new Error(`Grid size ${rows}x${cols} requires ${count} dice but only ${DICE.length} available.`);
  }

  // Fisher-Yates shuffle, then pick the first `count` dice
  const shuffled = [...DICE];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const chosen = shuffled.slice(0, count);

  // For each die, pick a random face
  const flat = chosen.map(die => die[Math.floor(Math.random() * die.length)]);

  // Reshape into rows×cols 2D array
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid.push(flat.slice(r * cols, r * cols + cols));
  }
  return grid;
}

/**
 * Generate a grid of size rows×cols, cycling through all 16 dice as needed.
 * For grids larger than 16 cells (5×5, 6×6), exhausted dice are reshuffled
 * and drawn again without replacement until all cells are filled.
 * Returns a 2D array (rows×cols) of letter strings (possibly 'Qu').
 */
export function generateGridCyclic(rows, cols) {
  if (!DICE) throw new Error('Dice not loaded. Call loadDice() first.');
  const count = rows * cols;
  const flat = [];
  while (flat.length < count) {
    const remaining = count - flat.length;
    const shuffled = [...DICE];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const chosen = shuffled.slice(0, Math.min(remaining, shuffled.length));
    flat.push(...chosen.map(die => die[Math.floor(Math.random() * die.length)]));
  }
  const grid = [];
  for (let r = 0; r < rows; r++) grid.push(flat.slice(r * cols, r * cols + cols));
  return grid;
}

const adjCache = new Map();

/**
 * Returns an adjacency map: for each cell index [r*cols+c],
 * which other cell indices are adjacent (8-directional)?
 * Result is cached — only computed once per unique (rows, cols) pair.
 */
export function buildAdjacency(rows, cols) {
  const key = `${rows}x${cols}`;
  if (adjCache.has(key)) return adjCache.get(key);
  const adj = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      adj[idx] = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            adj[idx].push(nr * cols + nc);
          }
        }
      }
    }
  }
  adjCache.set(key, adj);
  return adj;
}
