import { getCurrentGame } from './game.js';

export function isValidNumberPair(a, b) {
  if (a === null || b === null) return false;
  return a === b || a + b === 10;
}

export function canConnect(index1, index2) {
  const game = getCurrentGame();
  if (!game) return false;

  const grid = game.grid;
  const cols = 9;

  if (index1 === index2 || grid[index1] === null || grid[index2] === null) {
    return false;
  }

  const row1 = Math.floor(index1 / cols);
  const col1 = index1 % cols;
  const row2 = Math.floor(index2 / cols);
  const col2 = index2 % cols;

  const isAdjacent =
    (Math.abs(row1 - row2) === 1 && col1 === col2) ||
    (Math.abs(col1 - col2) === 1 && row1 === row2);

  if (isAdjacent) {
    return true;
  }

  if (row1 === row2) {
    const start = Math.min(index1, index2);
    const end = Math.max(index1, index2);
    for (let i = start + 1; i < end; i++) {
      if (grid[i] !== null) {
        return false;
      }
    }
    return true;
  }

  if (col1 === col2) {
    const startRow = Math.min(row1, row2);
    const endRow = Math.max(row1, row2);
    for (let row = startRow + 1; row < endRow; row++) {
      const idx = row * cols + col1;
      if (grid[idx] !== null) {
        return false;
      }
    }
    return true;
  }

  const isRowBoundary =
    (col1 === cols - 1 && col2 === 0 && row2 === row1 + 1) ||
    (col2 === cols - 1 && col1 === 0 && row1 === row2 + 1);

  if (isRowBoundary) {
    return true;
  }

  return false;
}

export function countValidMoves() {
  const game = getCurrentGame();
  if (!game) return 0;

  const grid = game.grid;
  let count = 0;

  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === null) continue;

    for (let j = i + 1; j < grid.length; j++) {
      if (grid[j] === null) continue;

      if (isValidNumberPair(grid[i], grid[j]) && canConnect(i, j)) {
        count++;
        if (count >= 6) return '5+';
      }
    }
  }

  return count;
}

export function getAllValidMoves() {
  const game = getCurrentGame();
  if (!game) return [];

  const grid = game.grid;
  const moves = [];

  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === null) continue;

    for (let j = i + 1; j < grid.length; j++) {
      if (grid[j] === null) continue;

      if (isValidNumberPair(grid[i], grid[j]) && canConnect(i, j)) {
        moves.push({
          index1: i,
          index2: j,
          number1: grid[i],
          number2: grid[j],
          type: grid[i] === grid[j] ? 'identical' : 'sum',
        });
      }
    }
  }

  return moves;
}
