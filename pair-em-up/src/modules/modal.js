import { getCurrentGame } from './game.js';
import { canConnect, isValidNumberPair } from './pairs.js';

export function showHintModal(validMovesCount) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Available Moves</h3>
      <div class="hint-info">
        <p>There are <strong>${validMovesCount}</strong> valid moves available</p>
        ${validMovesCount > 0 ? '<div class="hint-suggestion">Try looking for matching numbers or pairs that sum to 10!</div>' : ''}
      </div>
      <button class="modal-close-btn">OK</button>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.modal-close-btn');
  const closeModal = () => {
    if (modal.parentNode === document.body) {
      document.body.removeChild(modal);
    }
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (validMovesCount > 3) {
    setTimeout(closeModal, 3000);
  }
}

export function showVisualHints() {
  const game = getCurrentGame();
  if (!game) return;

  const hints = findAvailableMoves();

  clearVisualHints();

  for (const [index1, index2] of hints) {
    highlightCell(index1);
    highlightCell(index2);
  }

  setTimeout(clearVisualHints, 5000);
}

function highlightCell(index) {
  const cell = document.querySelector(`[data-index="${index}"]`);
  if (cell) {
    cell.classList.add('hint-highlight');
  }
}

function clearVisualHints() {
  const cells = document.querySelectorAll('.hint-highlight');
  for (const cell of cells) {
    cell.classList.remove('hint-highlight');
  }
}

function findAvailableMoves() {
  const game = getCurrentGame();
  if (!game) return [];

  const grid = game.grid;
  const moves = [];

  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === null) continue;

    for (let j = i + 1; j < grid.length; j++) {
      if (grid[j] === null) continue;

      if (isValidNumberPair(grid[i], grid[j]) && canConnect(i, j)) {
        moves.push([i, j]);
        if (moves.length >= 10) return moves;
      }
    }
  }

  return moves;
}
