/**
 * gameState.js
 * Central state for the current game session.
 */

export const GRID_SIZES = {
  '4x4': { rows: 4, cols: 4 },
  '3x3': { rows: 3, cols: 3 },
  '3x2': { rows: 3, cols: 2 },
  '2x2': { rows: 2, cols: 2 },
};

export const DIFFICULTY = {
  RANDOM: 'random',
  FEW: 'few',
  MANY: 'many',
};

// Thresholds for difficulty modes
export const DIFFICULTY_CONFIG = {
  [DIFFICULTY.RANDOM]: { min: 1,  max: Infinity },
  [DIFFICULTY.FEW]:    { min: 2,  max: 5 },
  [DIFFICULTY.MANY]:   { min: 8,  max: Infinity },
};

export const VALID_DURATIONS = [15, 30, 60, null]; // null = untimed
export const VALID_MIN_LENGTHS = [3, 4, 5, 6];

const state = {
  // Setup
  gridSize: '3x3',
  difficulty: DIFFICULTY.RANDOM,
  duration: 30,        // seconds — selected by player
  minWordLen: 4,       // minimum letters to count as a valid word

  // Current game
  grid: null,          // 2D array of letter strings
  rows: 3,
  cols: 3,
  allWords: null,      // Set of all valid words in current grid
  foundWords: new Set(), // Words found by player this session
  score: 0,

  // Timer
  timeLeft: 30,
  timerInterval: null,
  phase: 'setup',      // 'setup' | 'playing' | 'results'
};

export function getState() { return state; }

export function setGridSize(sizeKey) {
  if (!GRID_SIZES[sizeKey]) throw new Error(`Unknown grid size: ${sizeKey}`);
  state.gridSize = sizeKey;
  state.rows = GRID_SIZES[sizeKey].rows;
  state.cols = GRID_SIZES[sizeKey].cols;
}

export function setDifficulty(diff) {
  state.difficulty = diff;
}

export function setDuration(seconds) {
  if (!VALID_DURATIONS.includes(seconds)) throw new Error(`Invalid duration: ${seconds}`);
  state.duration = seconds;
}

export function setMinWordLen(len) {
  if (!VALID_MIN_LENGTHS.includes(len)) throw new Error(`Invalid min word length: ${len}`);
  state.minWordLen = len;
}

export function startGame(grid, allWords) {
  state.grid = grid;
  state.allWords = allWords;
  state.foundWords = new Set();
  state.score = 0;
  state.timeLeft = state.duration;
  state.phase = 'playing';
}

export function submitWord(word) {
  const lower = word.toLowerCase();
  if (state.foundWords.has(lower)) return 'duplicate';
  if (!state.allWords.has(lower)) return 'invalid';
  state.foundWords.add(lower);
  state.score += scoreWord(lower);
  return 'accepted';
}

export function endGame() {
  state.phase = 'results';
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

export function getMissedWords() {
  if (!state.allWords) return [];
  return [...state.allWords].filter(w => !state.foundWords.has(w)).sort();
}

export function getFoundWordsSorted() {
  return [...state.foundWords].sort();
}

export function getMaxScore() {
  if (!state.allWords) return 0;
  let total = 0;
  for (const word of state.allWords) total += scoreWord(word);
  return total;
}

/** Standard Boggle scoring by word length */
function scoreWord(word) {
  const len = word.length;
  if (len <= 4) return 1;
  if (len === 5) return 2;
  if (len === 6) return 3;
  if (len === 7) return 5;
  return 11; // 8+
}
