/**
 * wordValidator.js
 * Real-time validation of user's typed word against the current grid.
 *
 * Status is 'valid' only when the FULL typed string can be traced as a
 * connected path through the grid (no cell reuse, 8-directional adjacency).
 * 'Qu' on a die matches two typed characters ('Q','U').
 */

import { buildAdjacency } from './gridGenerator.js';

/**
 * Validate the typed input against the grid in real time.
 *
 * @param {string} typed  - What the user has typed so far (may be partial)
 * @param {string[][]} grid - 2D array of cell letters (e.g. 'A', 'Qu', 'N')
 * @param {number} rows
 * @param {number} cols
 * @returns {{ status: 'empty'|'valid'|'invalid', completePaths: number[][], partialPaths: number[][] }}
 *   completePaths: paths that consumed ALL typed characters
 *   partialPaths:  longest partial paths found (for invalid-state highlighting)
 */
export function validateInput(typed, grid, rows, cols) {
  if (!typed || typed.length === 0) {
    return { status: 'empty', completePaths: [], partialPaths: [] };
  }

  const upper = typed.toUpperCase();
  const flat = grid.flat();
  const adj = buildAdjacency(rows, cols);

  const completePaths = [];
  const partialPaths  = [];

  for (let startIdx = 0; startIdx < flat.length; startIdx++) {
    const visited = new Uint8Array(flat.length);
    explorePaths(startIdx, visited, upper, 0, flat, adj, [], completePaths, partialPaths);
  }

  return {
    status: completePaths.length > 0 ? 'valid' : 'invalid',
    completePaths,
    partialPaths,
  };
}

/**
 * Recursive DFS. Pushes to completePaths when all typed chars are consumed.
 * Pushes to partialPaths whenever a cell matches at the deepest point reached
 * (for invalid highlighting we want the furthest progress along the path).
 */
function explorePaths(idx, visited, typed, typedPos, flat, adj, currentPath, completePaths, partialPaths) {
  const cellLetter = flat[idx].toUpperCase(); // 'A' or 'QU'
  const remaining  = typed.slice(typedPos);

  if (!remaining.startsWith(cellLetter)) return;

  const newPos = typedPos + cellLetter.length;
  visited[idx] = 1;
  currentPath.push(idx);

  if (newPos === typed.length) {
    // Full match — record complete path
    completePaths.push([...currentPath]);
  } else {
    // Continue deeper
    let extended = false;
    for (const nextIdx of adj[idx]) {
      if (!visited[nextIdx]) {
        const before = completePaths.length + partialPaths.length;
        explorePaths(nextIdx, visited, typed, newPos, flat, adj, currentPath, completePaths, partialPaths);
        if (completePaths.length + partialPaths.length > before) extended = true;
      }
    }
    // If no deeper extension was found, this is the deepest partial path
    if (!extended) {
      partialPaths.push([...currentPath]);
    }
  }

  visited[idx] = 0;
  currentPath.pop();
}

