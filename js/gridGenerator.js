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

  // Shuffle and pick count dice (without replacement)
  const shuffled = [...DICE].sort(() => Math.random() - 0.5);
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
 * Returns an adjacency map: for each cell index [r*cols+c],
 * which other cell indices are adjacent (8-directional)?
 */
export function buildAdjacency(rows, cols) {
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
  return adj;
}
