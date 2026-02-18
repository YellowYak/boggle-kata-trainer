/**
 * wordSolver.js
 * Loads TWL word list and finds all valid words in a Boggle grid via DFS.
 */

import { buildAdjacency } from './gridGenerator.js';

// Trie node structure for fast prefix checking
class TrieNode {
  constructor() {
    this.children = {};
    this.isWord = false;
  }
}

let trieRoot = null;

export async function loadWordList() {
  if (trieRoot) return;
  const resp = await fetch('assets/twl.txt');
  const text = await resp.text();
  const words = text.trim().split('\n').map(w => w.trim().toLowerCase());

  trieRoot = new TrieNode();

  for (const word of words) {
    if (word.length < 3) continue; // Only index words length ≥3
    let node = trieRoot;
    for (const ch of word) {
      if (!node.children[ch]) node.children[ch] = new TrieNode();
      node = node.children[ch];
    }
    node.isWord = true;
  }
}

/**
 * Find all valid words (length ≥ minWordLen) in the given grid.
 * grid: 2D array of letter strings (possibly 'Qu')
 * Returns: Set of valid word strings (lowercase)
 */
export function solveGrid(grid, rows, cols, minWordLen = 4) {
  if (!trieRoot) throw new Error('Word list not loaded. Call loadWordList() first.');

  const adj = buildAdjacency(rows, cols);
  const flat = grid.flat(); // flat array of cell letters
  const found = new Set();

  // DFS from each starting cell
  for (let startIdx = 0; startIdx < flat.length; startIdx++) {
    const visited = new Uint8Array(flat.length); // fast boolean array
    dfs(startIdx, visited, trieRoot, '', flat, adj, found, minWordLen);
  }

  return found;
}

function dfs(idx, visited, trieNode, currentWord, flat, adj, found, minWordLen) {
  const letter = flat[idx].toLowerCase(); // e.g. 'qu' or 'a'

  // Walk the trie for each character in this letter (handles 'qu' as two chars)
  let node = trieNode;
  for (const ch of letter) {
    if (!node.children[ch]) return; // No words with this prefix
    node = node.children[ch];
  }

  visited[idx] = 1;
  currentWord += letter;

  if (currentWord.length >= minWordLen && node.isWord) {
    found.add(currentWord);
  }

  // Continue DFS to adjacent unvisited cells
  for (const nextIdx of adj[idx]) {
    if (!visited[nextIdx]) {
      dfs(nextIdx, visited, node, currentWord, flat, adj, found, minWordLen);
    }
  }

  visited[idx] = 0;
}

/**
 * For a given word, find all valid paths through the grid.
 * Returns array of paths, each path is an array of cell indices.
 * Used for highlighting solutions.
 */
export function findWordPaths(word, grid, rows, cols) {
  const flat = grid.flat();
  const adj = buildAdjacency(rows, cols);
  const lowerWord = word.toLowerCase();
  const paths = [];

  for (let startIdx = 0; startIdx < flat.length; startIdx++) {
    const visited = new Uint8Array(flat.length);
    findPaths(startIdx, visited, lowerWord, 0, flat, adj, [], paths);
  }

  return paths;
}

function findPaths(idx, visited, word, wordPos, flat, adj, currentPath, paths) {
  const letter = flat[idx].toLowerCase();
  const remaining = word.slice(wordPos);

  // Check this cell's letter matches the current position in word
  if (!remaining.startsWith(letter)) return;

  const newPos = wordPos + letter.length;
  visited[idx] = 1;
  currentPath.push(idx);

  if (newPos === word.length) {
    paths.push([...currentPath]);
  } else {
    for (const nextIdx of adj[idx]) {
      if (!visited[nextIdx]) {
        findPaths(nextIdx, visited, word, newPos, flat, adj, currentPath, paths);
      }
    }
  }

  visited[idx] = 0;
  currentPath.pop();
}
