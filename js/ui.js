/**
 * ui.js
 * Shared UI helpers used by both katas.js and solver.js.
 */

import { scoreWord } from './gameState.js';

const loadingOverlay = document.getElementById('loading-overlay');
const loadingMsg     = document.getElementById('loading-msg');

export function showLoading(msg) {
  loadingMsg.textContent = msg;
  loadingOverlay.classList.add('visible');
}

export function hideLoading() {
  loadingOverlay.classList.remove('visible');
}

/** Wire up an exclusive toggle button group. `onSelect` receives the clicked button. */
export function bindButtonGroup(selector, onSelect) {
  const buttons = document.querySelectorAll(selector);
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      onSelect(btn);
    });
  });
}

/** Programmatically select a button in a group by matching its numeric dataset attribute. */
export function setButtonGroupValue(selector, attrName, value) {
  document.querySelectorAll(selector).forEach(btn => {
    const isMatch = +btn.dataset[attrName] === +value;
    btn.classList.toggle('selected', isMatch);
    btn.setAttribute('aria-pressed', String(isMatch));
  });
}

/** Generate an anchor tag linking to dictionary.com for a word. */
export function wordLink(word, cssClass) {
  const score = scoreWord(word);
  return `<a class="result-word ${cssClass}" href="https://www.dictionary.com/browse/${word}?noredirect=true" target="_blank" rel="noopener noreferrer" title="Score: ${score}">${word.toUpperCase()}</a>`;
}
