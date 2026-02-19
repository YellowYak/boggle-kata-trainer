/**
 * gameState.js
 * Central state for the current game session.
 */

const GRID_SIZES = {
  '6x6': { rows: 6, cols: 6 },
  '5x5': { rows: 5, cols: 5 },
  '4x4': { rows: 4, cols: 4 },
  '3x3': { rows: 3, cols: 3 },
  '3x2': { rows: 3, cols: 2 },
  '2x2': { rows: 2, cols: 2 },
};

const DIFFICULTY = {
  RANDOM: 'random',
  FEW: 'few',
  MANY: 'many',
};

// Thresholds for difficulty modes, keyed by grid size then difficulty
export const DIFFICULTY_CONFIG = {
  '2x2': {
    [DIFFICULTY.RANDOM]: { min: 1, max: Infinity },
    [DIFFICULTY.FEW]:    { min: 1, max: 2 },
    [DIFFICULTY.MANY]:   { min: 3, max: Infinity },
  },
  '3x2': {
    [DIFFICULTY.RANDOM]: { min: 1, max: Infinity },
    [DIFFICULTY.FEW]:    { min: 1, max: 2 },
    [DIFFICULTY.MANY]:   { min: 4, max: Infinity },
  },
  '3x3': {
    [DIFFICULTY.RANDOM]: { min: 1, max: Infinity },
    [DIFFICULTY.FEW]:    { min: 1, max: 3 },
    [DIFFICULTY.MANY]:   { min: 6, max: Infinity },
  },
  '4x4': {
    [DIFFICULTY.RANDOM]: { min: 1,  max: Infinity },
    [DIFFICULTY.FEW]:    { min: 1,  max: 5 },
    [DIFFICULTY.MANY]:   { min: 10, max: Infinity },
  },
  '5x5': {
    [DIFFICULTY.RANDOM]: { min: 1,  max: Infinity },
    [DIFFICULTY.FEW]:    { min: 1,  max: 7 },
    [DIFFICULTY.MANY]:   { min: 15, max: Infinity },
  },
  '6x6': {
    [DIFFICULTY.RANDOM]: { min: 1,  max: Infinity },
    [DIFFICULTY.FEW]:    { min: 2,  max: 10 },
    [DIFFICULTY.MANY]:   { min: 25, max: Infinity },
  },
};

const VALID_DURATIONS = [15, 30, 60, 120, 180, null]; // null = untimed
export const VALID_MIN_LENGTHS = [3, 4, 5, 6];
export const SOLVER_SIZES = [4, 5, 6];
export const TIMER_URGENT_THRESHOLD = 10; // seconds at which timer turns red

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

const byScoreDesc = (a, b) => scoreWord(b) - scoreWord(a) || a.localeCompare(b);

export function getMissedWords() {
  if (!state.allWords) return [];
  return [...state.allWords].filter(w => !state.foundWords.has(w)).sort(byScoreDesc);
}

export function getFoundWordsSorted() {
  return [...state.foundWords].sort(byScoreDesc);
}

export function getMaxScore() {
  if (!state.allWords) return 0;
  let total = 0;
  for (const word of state.allWords) total += scoreWord(word);
  return total;
}

/** Standard Boggle scoring by word length */
export function scoreWord(word) {
  const len = word.length;
  if (len <= 4) return 1;
  if (len === 5) return 2;
  if (len === 6) return 3;
  if (len === 7) return 5;
  return 11; // 8+
}
