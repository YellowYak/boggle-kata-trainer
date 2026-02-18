/**
 * app.js
 * Main game controller — wires up UI, state, grid generation, and validation.
 */

import { loadDice, generateGrid } from './gridGenerator.js';
import { loadWordList, solveGrid } from './wordSolver.js';
import { validateInput } from './wordValidator.js';
import {
  getState, setGridSize, setDifficulty, setDuration, setMinWordLen, startGame, submitWord, endGame,
  getMissedWords, getFoundWordsSorted, getMaxScore,
  DIFFICULTY_CONFIG,
} from './gameState.js';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const setupScreen   = document.getElementById('setup-screen');
const gameScreen    = document.getElementById('game-screen');
const resultsScreen = document.getElementById('results-screen');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingMsg    = document.getElementById('loading-msg');

const startBtn      = document.getElementById('start-btn');
const gridEl        = document.getElementById('grid');
const timerDisplay  = document.getElementById('timer-display');
const timerSecLabel = document.getElementById('timer-sec-label');
const wordCountLabel= document.getElementById('word-count-label');
const wordInput     = document.getElementById('word-input');
const deleteBtnEl   = document.getElementById('delete-btn');
const submitBtnEl   = document.getElementById('submit-btn');
const inputHint     = document.getElementById('input-hint');
const foundWordsList= document.getElementById('found-words-list');
const endGameBtn    = document.getElementById('end-game-btn');
const diffHint      = document.getElementById('diff-hint');

const resultGridEl       = document.getElementById('result-grid');
const resultHeadingEl    = document.getElementById('result-heading');
const resultSubheadingEl = document.getElementById('result-subheading');
const resultFoundEl      = document.getElementById('result-found-words');
const resultMissedEl     = document.getElementById('result-missed-words');
const resultScoreEl      = document.getElementById('result-score');
const resultMaxScoreEl   = document.getElementById('result-max-score');
const resultTotalEl      = document.getElementById('result-total');
const playAgainBtn    = document.getElementById('play-again-btn');
const newSetupBtn     = document.getElementById('new-setup-btn');

// ── Init ──────────────────────────────────────────────────────────────────────
(async function init() {
  showLoading('Loading word list…');
  await Promise.all([loadDice(), loadWordList()]);
  hideLoading();
  showScreen('setup');
  bindSetupUI();
  bindGameUI();
  bindResultsUI();
})();

// ── Screen helpers ────────────────────────────────────────────────────────────
function showScreen(name) {
  setupScreen.classList.toggle('active',   name === 'setup');
  gameScreen.classList.toggle('active',    name === 'game');
  resultsScreen.classList.toggle('active', name === 'results');
}

function showLoading(msg) {
  loadingMsg.textContent = msg;
  loadingOverlay.classList.add('visible');
}

function hideLoading() {
  loadingOverlay.classList.remove('visible');
}

// ── Setup UI ──────────────────────────────────────────────────────────────────
function bindSetupUI() {
  // Grid size buttons
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      setGridSize(btn.dataset.size);
      syncConstraints();
    });
  });

  // Difficulty buttons
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      setDifficulty(btn.dataset.diff);
    });
  });

  // Min word length buttons
  document.querySelectorAll('.minlen-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.minlen-btn').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      setMinWordLen(Number(btn.dataset.minlen));
      syncConstraints();
    });
  });

  // Duration buttons
  document.querySelectorAll('.dur-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dur-btn').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      const dur = btn.dataset.dur === 'untimed' ? null : Number(btn.dataset.dur);
      setDuration(dur);
    });
  });

  startBtn.addEventListener('click', handleStartGame);

  syncConstraints(); // apply initial disabled state (also sets hint label)
}

function updateDifficultyHint() {
  const st = getState();
  const cfg = DIFFICULTY_CONFIG[st.gridSize];
  const fmt = ({ min, max }) =>
    max === Infinity ? `${min}+` : `${min}–${max}`;
  diffHint.textContent =
    `Random: ${fmt(cfg.random)}  |  Few Words: ${fmt(cfg.few)}  |  Many Words: ${fmt(cfg.many)}`;
}

/**
 * Disable options that are incompatible with the current selection,
 * and auto-fix the active selection if it has become invalid.
 * Rules: 2×2 grid cannot be combined with minWordLen ≥ 5.
 */
function syncConstraints() {
  updateDifficultyHint();
  const st = getState();
  const is2x2     = st.gridSize === '2x2';
  const isLongWord = st.minWordLen >= 5;

  // Disable/enable min-word-length buttons
  document.querySelectorAll('.minlen-btn').forEach(btn => {
    btn.disabled = is2x2 && Number(btn.dataset.minlen) >= 5;
  });

  // Disable/enable the 2×2 size button
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.disabled = isLongWord && btn.dataset.size === '2x2';
  });

  // Auto-fix: 2×2 selected but minWordLen is now disabled → fall back to 4
  if (is2x2 && isLongWord) {
    document.querySelectorAll('.minlen-btn').forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    const fallback = document.querySelector('.minlen-btn[data-minlen="4"]');
    fallback.classList.add('selected');
    fallback.setAttribute('aria-pressed', 'true');
    setMinWordLen(4);
    // Re-run to update disabled states with the corrected minWordLen
    document.querySelectorAll('.minlen-btn').forEach(btn => {
      btn.disabled = Number(btn.dataset.minlen) >= 5;
    });
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.disabled = false;
    });
  }
}

// ── Game generation ───────────────────────────────────────────────────────────
async function handleStartGame() {
  const st = getState();

  // Guard: 2×2 + minWordLen ≥ 5 is an impossible combination
  if (st.gridSize === '2x2' && st.minWordLen >= 5) {
    syncConstraints(); // re-sync UI in case it drifted
    return;
  }

  showLoading('Generating grid…');

  // Run grid gen in a microtask so the UI can update first
  await new Promise(r => setTimeout(r, 30));

  let grid, words;
  const { rows, cols } = st;
  const cfg = DIFFICULTY_CONFIG[st.gridSize][st.difficulty];
  let attempts = 0;
  const maxAttempts = 200;

  do {
    grid = generateGrid(rows, cols);
    words = solveGrid(grid, rows, cols, st.minWordLen);
    attempts++;
    if (attempts >= maxAttempts) break;
  } while (words.size < cfg.min || words.size > cfg.max);

  // Fallback: if difficulty constraints couldn't be met, keep retrying
  // until we have at least 1 word — so the game is always playable.
  if (words.size === 0) {
    do {
      grid = generateGrid(rows, cols);
      words = solveGrid(grid, rows, cols, st.minWordLen);
    } while (words.size === 0);
  }

  hideLoading();
  startGame(grid, words);
  renderGrid(grid, cols);
  showScreen('game');
  startTimer();
  resetHistory();
  wordInput.value = '';
  wordInput.focus();
  clearFoundWords();
  updateWordCountLabel();
}

// ── Grid rendering ────────────────────────────────────────────────────────────
function renderGrid(grid, cols) {
  gridEl.innerHTML = '';
  gridEl.style.gridTemplateColumns = `repeat(${cols}, auto)`;

  const flat = grid.flat();
  flat.forEach((letter, idx) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.idx = idx;
    cell.textContent = letter; // 'Qu' displays as-is
    cell.addEventListener('click', () => handleCellTap(letter, idx));
    gridEl.appendChild(cell);
  });
}

function highlightCells(path, isInvalid = false) {
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('path-highlight', 'last', 'invalid-highlight');
  });

  if (!path || path.length === 0) return;

  path.forEach((idx, i) => {
    const cell = gridEl.querySelector(`[data-idx="${idx}"]`);
    if (!cell) return;
    const isLast = i === path.length - 1;
    if (isInvalid && isLast) {
      cell.classList.add('invalid-highlight');
    } else {
      cell.classList.add('path-highlight');
      if (isLast) cell.classList.add('last');
    }
  });
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
  const st = getState();

  if (st.duration === null) {
    timerDisplay.textContent = '–';
    timerDisplay.classList.remove('urgent');
    timerSecLabel.hidden = true;
    return;
  }

  timerSecLabel.hidden = false;
  updateTimerDisplay(st.timeLeft);

  st.timerInterval = setInterval(() => {
    st.timeLeft--;
    updateTimerDisplay(st.timeLeft);
    if (st.timeLeft <= 0) {
      clearInterval(st.timerInterval);
      st.timerInterval = null;
      handleTimeUp();
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  timerDisplay.textContent = String(seconds).padStart(2, '0');
  timerDisplay.classList.toggle('urgent', seconds <= 10);
}

function handleTimeUp() {
  endGame();
  showResults('timeup');
}

// ── Input history (bash-style) ────────────────────────────────────────────────
let inputHistory = [];   // oldest → newest
let historyIndex = -1;  // -1 = not navigating

// ── Touch / cell-tap state ────────────────────────────────────────────────────
let tapHistory = [];       // letters appended by cell taps (most recent game word)
let tapPath    = [];       // cell indices for tapped letters (parallel to tapHistory)
let lastInputWasTouch = false; // true when last character came from a cell tap

function resetHistory() {
  inputHistory = [];
  historyIndex = -1;
  tapHistory = [];
  tapPath    = [];
  lastInputWasTouch = false;
}

/** True when two grid cells are 8-directionally adjacent. */
function isAdjacent(idx1, idx2, cols) {
  const r1 = Math.floor(idx1 / cols), c1 = idx1 % cols;
  const r2 = Math.floor(idx2 / cols), c2 = idx2 % cols;
  return idx1 !== idx2 && Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
}

function historyUp() {
  if (inputHistory.length === 0) return;
  if (historyIndex === -1) historyIndex = inputHistory.length - 1;
  else if (historyIndex > 0) historyIndex--;
  else return; // already at oldest
  wordInput.value = inputHistory[historyIndex];
  handleTyping();
}

function historyDown() {
  if (historyIndex === -1) return; // not navigating
  if (historyIndex < inputHistory.length - 1) {
    historyIndex++;
    wordInput.value = inputHistory[historyIndex];
  } else {
    historyIndex = -1;
    wordInput.value = '';
  }
  handleTyping();
}

// ── Cell tap (touch input) ────────────────────────────────────────────────────
function handleCellTap(letter, idx) {
  const st = getState();
  if (st.phase !== 'playing') return;

  // Reject if this cell is already in the current tap path
  if (tapPath.includes(idx)) return;

  // Reject if not adjacent to the previously tapped cell
  if (tapPath.length > 0 && !isAdjacent(tapPath[tapPath.length - 1], idx, st.cols)) return;

  lastInputWasTouch = true;
  tapPath.push(idx);
  tapHistory.push(letter);
  wordInput.value += letter;
  historyIndex = -1;
  handleTyping();
}

function handleDeleteLetter() {
  if (getState().phase !== 'playing') return;
  if (!wordInput.value) return;
  if (tapHistory.length > 0) {
    const removed = tapHistory.pop();
    tapPath.pop();
    wordInput.value = wordInput.value.slice(0, -removed.length);
  } else {
    wordInput.value = wordInput.value.slice(0, -1);
  }
  historyIndex = -1;
  handleTyping();
}

// ── Game input ────────────────────────────────────────────────────────────────
function bindGameUI() {
  wordInput.addEventListener('input', () => {
    tapHistory = [];        // keyboard edit invalidates tap-unit tracking
    tapPath    = [];
    lastInputWasTouch = false;
    historyIndex = -1;
    handleTyping();
  });
  deleteBtnEl.addEventListener('click', handleDeleteLetter);
  wordInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      historyUp();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      historyDown();
    }
  });
  submitBtnEl.addEventListener('click', handleSubmit);

  endGameBtn.addEventListener('click', () => {
    if (getState().phase !== 'playing') return;
    endGame();
    showResults('manual');
  });
}

function handleTyping() {
  const st = getState();
  if (st.phase !== 'playing') return;

  const typed = wordInput.value;

  if (!typed) {
    wordInput.className = '';
    inputHint.textContent = '';
    highlightCells(null);
    return;
  }

  const result = validateInput(typed, st.grid, st.rows, st.cols);

  if (result.status === 'valid') {
    wordInput.className = 'valid-path';
    inputHint.textContent = '';
    // When the word was built entirely by tapping, highlight the exact tapped cells.
    // Otherwise (keyboard entry) use the first DFS-found valid path.
    const byTap = tapPath.length > 0 && tapHistory.join('') === typed;
    highlightCells(byTap ? tapPath : result.completePaths[0], false);
  } else {
    wordInput.className = 'invalid-path';
    inputHint.textContent = 'Invalid path — letter not reachable from here';
    highlightCells(result.partialPaths[0], true);
  }
}

function handleSubmit() {
  const st = getState();
  if (st.phase !== 'playing') return;

  const word = wordInput.value.trim();
  if (!word) return;

  inputHistory.push(word);
  historyIndex = -1;
  tapHistory = [];
  tapPath    = [];

  const result = submitWord(word);

  if (result === 'accepted') {
    addFoundWordTag(word);
    updateWordCountLabel();
    wordInput.value = '';
    wordInput.className = '';
    highlightCells(null);

    // Check for a sweep — all words found before time ran out
    if (st.foundWords.size === st.allWords.size) {
      endGame();
      showResults('swept');
      return;
    }

    inputHint.textContent = `"${word.toUpperCase()}" accepted!`;
  } else if (result === 'duplicate') {
    inputHint.textContent = 'Already found!';
    wordInput.value = '';
    wordInput.className = '';
    highlightCells(null);
  } else {
    inputHint.textContent = 'Not a valid word in this grid.';
    wordInput.value = '';
    wordInput.className = '';
    highlightCells(null);
  }

  if (!lastInputWasTouch) wordInput.focus();

  // Clear hint after 1.5s
  setTimeout(() => {
    if (inputHint.textContent !== '') {
      inputHint.textContent = '';
    }
  }, 1500);
}

function clearFoundWords() {
  foundWordsList.innerHTML = '';
}

function addFoundWordTag(word) {
  const tag = document.createElement('span');
  tag.className = 'found-word-tag';
  tag.textContent = word.toUpperCase();
  foundWordsList.appendChild(tag);
}

function updateWordCountLabel() {
  const st = getState();
  const found = st.foundWords.size;
  const total = st.allWords ? st.allWords.size : '?';
  wordCountLabel.textContent = `${found} / ${total} words`;
}

// ── Results ───────────────────────────────────────────────────────────────────
function showResults(reason) {
  const st = getState();
  const found = getFoundWordsSorted();
  const missed = getMissedWords();

  if (reason === 'swept') {
    resultHeadingEl.textContent = 'Flawless!';
    resultSubheadingEl.textContent = `You found every word with ${st.timeLeft}s to spare!`;
  } else if (reason === 'manual') {
    resultHeadingEl.textContent = 'Game Over!';
    resultSubheadingEl.textContent = '';
  } else {
    resultHeadingEl.textContent = "Time's Up!";
    resultSubheadingEl.textContent = '';
  }

  resultScoreEl.textContent = st.score;
  resultMaxScoreEl.textContent = getMaxScore();
  resultTotalEl.textContent = `${found.length} of ${st.allWords.size} words found`;

  resultFoundEl.innerHTML = found.map(w =>
    `<a class="result-word found" href="https://www.dictionary.com/browse/${w}?noredirect=true" target="_blank" rel="noopener noreferrer">${w.toUpperCase()}</a>`
  ).join('');

  const missedSection = resultMissedEl.closest('.results-section');
  if (reason === 'swept') {
    missedSection.hidden = true;
  } else {
    missedSection.hidden = false;
    resultMissedEl.innerHTML = missed.map(w =>
      `<a class="result-word missed" href="https://www.dictionary.com/browse/${w}?noredirect=true" target="_blank" rel="noopener noreferrer">${w.toUpperCase()}</a>`
    ).join('');
  }

  // Clear game grid highlights, then snapshot it into the results grid
  document.querySelectorAll('#grid .cell').forEach(c => {
    c.classList.remove('path-highlight', 'last', 'invalid-highlight');
  });
  resultGridEl.innerHTML = gridEl.innerHTML;
  resultGridEl.style.gridTemplateColumns = gridEl.style.gridTemplateColumns;

  showScreen('results');
}

// ── Results UI ────────────────────────────────────────────────────────────────
function bindResultsUI() {
  playAgainBtn.addEventListener('click', () => {
    // Replay same settings
    handleStartGame();
  });

  newSetupBtn.addEventListener('click', () => {
    const st = getState();
    if (st.timerInterval) {
      clearInterval(st.timerInterval);
      st.timerInterval = null;
    }
    showScreen('setup');
  });
}
