import { showLoading, hideLoading, bindButtonGroup, wordLink } from './ui.js';

const PAGE_SIZE = 50;

let allWords      = [];
let filteredWords = [];
let currentPage   = 0;
let selectedMode  = 'startsWith';
let debounceTimer = null;

const queryInput     = document.getElementById('query-input');
const minLenInput    = document.getElementById('min-len');
const maxLenInput    = document.getElementById('max-len');
const wordCountLabel = document.getElementById('word-count-label');
const wordsGrid      = document.getElementById('words-grid');
const modeBtns       = document.querySelectorAll('.mode-btn');

async function loadWords() {
  const res  = await fetch('assets/twl.txt');
  const text = await res.text();
  allWords = text.trim().split('\n').map(w => w.trim()).filter(Boolean);
}

function applyFilters() {
  const rawQuery = queryInput.value.trim().toLowerCase();
  const minLen   = parseInt(minLenInput.value) || 1;
  const maxLenVal = parseInt(maxLenInput.value);
  const maxLen   = maxLenVal > 0 ? maxLenVal : Infinity;
  const isWildcard = rawQuery.includes('_');

  // Dim mode buttons when wildcard is active (they're ignored)
  modeBtns.forEach(btn => { btn.disabled = isWildcard; });

  let re = null;
  if (isWildcard) {
    const escaped = rawQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/_/g, '.');
    re = new RegExp(`^${escaped}$`);
  }

  filteredWords = allWords.filter(word => {
    if (word.length < minLen || word.length > maxLen) return false;
    if (!rawQuery) return true;
    if (isWildcard) return re.test(word);
    if (selectedMode === 'startsWith') return word.startsWith(rawQuery);
    if (selectedMode === 'endsWith')   return word.endsWith(rawQuery);
    return word.includes(rawQuery); // 'contains'
  });

  currentPage = 0;
  renderPage();
}

function renderPage() {
  const total      = filteredWords.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start      = currentPage * PAGE_SIZE;
  const pageWords  = filteredWords.slice(start, start + PAGE_SIZE);

  wordCountLabel.textContent =
    `${total.toLocaleString()} word${total !== 1 ? 's' : ''} · Page ${(currentPage + 1).toLocaleString()} of ${totalPages.toLocaleString()}`;

  if (total === 0) {
    wordsGrid.innerHTML = '<p class="no-results">No words match your filters.</p>';
  } else {
    wordsGrid.innerHTML = pageWords.map(w => wordLink(w, 'found')).join('');
  }

  const atFirst = currentPage === 0;
  const atLast  = currentPage >= totalPages - 1;
  document.querySelectorAll('.prev-btn').forEach(b => { b.disabled = atFirst; });
  document.querySelectorAll('.next-btn').forEach(b => { b.disabled = atLast; });
}

function scheduleFilter() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(applyFilters, 200);
}

function bindEvents() {
  queryInput.addEventListener('input', scheduleFilter);
  minLenInput.addEventListener('change', applyFilters);
  maxLenInput.addEventListener('change', applyFilters);

  bindButtonGroup('.mode-btn', btn => {
    selectedMode = btn.dataset.mode;
    applyFilters();
  });

  document.querySelectorAll('.prev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentPage > 0) { currentPage--; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
  });

  document.querySelectorAll('.next-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredWords.length / PAGE_SIZE);
      if (currentPage < totalPages - 1) { currentPage++; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  showLoading('Loading word list…');
  await loadWords();
  filteredWords = [...allWords];
  bindEvents();
  renderPage();
  hideLoading();
});
