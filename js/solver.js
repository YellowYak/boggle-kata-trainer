/**
 * solver.js
 * Controller for the Boggle Solver page.
 * Accepts a user-entered grid and finds all valid words.
 */

import { loadWordList, solveGrid } from './wordSolver.js';

/** Standard Boggle scoring by word length */
function scoreWord(word) {
  const len = word.length;
  if (len <= 4) return 1;
  if (len === 5) return 2;
  if (len === 6) return 3;
  if (len === 7) return 5;
  return 11; // 8+
}

const loadingOverlay = document.getElementById('loading-overlay');
const loadingMsg     = document.getElementById('loading-msg');
const solveBtn       = document.getElementById('solve-btn');
const solverGrid     = document.getElementById('solver-grid');
const gridHint       = document.getElementById('grid-hint');
const resultsArea    = document.getElementById('results-area');
const resultsHeading = document.getElementById('results-heading');
const resultWords    = document.getElementById('result-words');

let currentSize = 4;
let currentMinLen = 4;

(async function init() {
  showLoading('Loading word list…');
  await loadWordList();
  hideLoading();
  solveBtn.disabled = false;
  bindSizeButtons();
  bindMinLenButtons();
  buildGrid(currentSize);
  bindSolveButton();
})();

function showLoading(msg) {
  loadingMsg.textContent = msg;
  loadingOverlay.classList.add('visible');
}

function hideLoading() {
  loadingOverlay.classList.remove('visible');
}

function bindSizeButtons() {
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      currentSize = Number(btn.dataset.size);
      buildGrid(currentSize);
      resultsArea.hidden = true;
      gridHint.textContent = '';
    });
  });
}

function bindMinLenButtons() {
  document.querySelectorAll('.minlen-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.minlen-btn').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      currentMinLen = Number(btn.dataset.minlen);
      resultsArea.hidden = true;
    });
  });
}

function buildGrid(n) {
  solverGrid.innerHTML = '';
  solverGrid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;

  for (let i = 0; i < n * n; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 1;
    input.autocomplete = 'off';
    input.autocorrect = 'off';
    input.autocapitalize = 'characters';
    input.spellcheck = false;
    input.inputMode = 'text';
    input.className = 'grid-cell-input';
    input.dataset.idx = i;
    input.setAttribute('aria-label', `Cell ${i + 1}`);

    input.addEventListener('input', e => handleCellInput(e, i, n));
    input.addEventListener('keydown', e => handleCellKeydown(e, i, n));
    input.addEventListener('focus', () => input.classList.remove('cell-error'));

    solverGrid.appendChild(input);
  }

  solverGrid.querySelector('.grid-cell-input')?.focus();
}

function handleCellInput(e, idx, n) {
  const input = e.target;
  const val = input.value.replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase();
  input.value = val;
  input.classList.remove('cell-error');

  if (val.length === 1) {
    const next = getCellAt(idx + 1, n);
    if (next) {
      next.focus();
      next.select();
    }
  }

  resultsArea.hidden = true;
  updateSolveBtnState();
}

function handleCellKeydown(e, idx, n) {
  if (e.key === 'Backspace') {
    const input = e.target;
    if (input.value === '') {
      const prev = getCellAt(idx - 1, n);
      if (prev) {
        prev.focus();
        prev.value = '';
        prev.classList.remove('cell-error');
      }
      e.preventDefault();
    }
    resultsArea.hidden = true;
    updateSolveBtnState();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    getCellAt(idx + 1, n)?.focus();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    getCellAt(idx - 1, n)?.focus();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    getCellAt(idx + n, n)?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    getCellAt(idx - n, n)?.focus();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (!solveBtn.disabled) handleSolve();
  }
}

function getCellAt(idx, n) {
  if (idx < 0 || idx >= n * n) return null;
  return solverGrid.querySelector(`[data-idx="${idx}"]`);
}

function updateSolveBtnState() {
  const cells = solverGrid.querySelectorAll('.grid-cell-input');
  const allFilled = [...cells].every(c => c.value.trim().length === 1);
  solveBtn.disabled = !allFilled;
}

function bindSolveButton() {
  solveBtn.addEventListener('click', handleSolve);
}

async function handleSolve() {
  const n = currentSize;
  const cells = [...solverGrid.querySelectorAll('.grid-cell-input')];

  const allFilled = cells.every(c => c.value.trim().length === 1);
  if (!allFilled) {
    gridHint.textContent = 'Please fill in all cells before solving.';
    cells.forEach(c => {
      if (!c.value.trim()) c.classList.add('cell-error');
    });
    return;
  }

  gridHint.textContent = '';

  // Build 2D grid array; convert Q → Qu (standard Boggle rule)
  const flat = cells.map(c => {
    const letter = c.value.trim().toUpperCase();
    return letter === 'Q' ? 'Qu' : letter;
  });

  const grid = [];
  for (let r = 0; r < n; r++) {
    grid.push(flat.slice(r * n, r * n + n));
  }

  showLoading('Solving…');
  await new Promise(r => setTimeout(r, 20)); // yield to allow overlay to paint

  let words;
  try {
    words = solveGrid(grid, n, n, currentMinLen);
  } catch (err) {
    hideLoading();
    gridHint.textContent = 'Error: word list not loaded. Please refresh the page.';
    return;
  }

  hideLoading();
  displayResults(words);
}

function displayResults(wordSet) {
  // Sort by length ascending, then alphabetically within each length
  const sorted = [...wordSet].sort((a, b) => {
    const scoreDiff = scoreWord(b) - scoreWord(a);
    if (scoreDiff !== 0) return scoreDiff;
    return a.localeCompare(b);
  });

  const count = sorted.length;
  const totalScore = sorted.reduce((sum, w) => sum + scoreWord(w), 0);
  resultsHeading.textContent = count === 0
    ? 'No words found'
    : `${count} word${count === 1 ? '' : 's'} found (${totalScore} point${totalScore === 1 ? '' : 's'})`;

  if (count === 0) {
    resultWords.innerHTML = '<span style="color:var(--muted);font-size:.9rem;">Try a different grid.</span>';
  } else {
    resultWords.innerHTML = sorted.map(w =>
      `<a class="result-word found" href="https://www.dictionary.com/browse/${w}?noredirect=true" target="_blank" rel="noopener noreferrer">${w.toUpperCase()}</a>`
    ).join('');
  }

  resultsArea.hidden = false;
  resultsArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
