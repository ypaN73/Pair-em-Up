import {
  ASSIST_LIMITS,
  GAME_MODES,
  GRID_CONFIG,
  SCORE_RULES,
} from '../utils/constants.js';
import { isAudioEnabled, playSound, setAudioEnabled } from './audio.js';
import { showHintModal, showVisualHints } from './modal.js';
import { canConnect, countValidMoves, isValidNumberPair } from './pairs.js';
import {
  loadGameState,
  loadResults,
  loadSettings,
  saveGameState,
  saveResult,
  saveSettings,
} from './storage.js';
import {
  createGameScreen,
  showResultsScreen,
  showSettingsScreen,
} from './ui.js';

let currentGame = null;
let gameTimer = null;
let startTime = null;
let currentTheme = 'light';

export function initGame() {
  const settings = loadSettings();
  currentTheme = settings.theme || 'light';
  setAudioEnabled(settings.sound !== false);

  applyTheme(currentTheme);
  showStartScreen();

  window.addEventListener('beforeunload', () => {
    if (currentGame) {
      saveGameState(currentGame);
    }
  });
}

function showStartScreen() {
  const app = document.getElementById('app');
  const savedGame = loadGameState();
  const canContinue = savedGame !== null;

  app.innerHTML = `
    <div class="start-screen">
      <h1>Pair 'em Up</h1>
      <div class="author">
        Created by <a href="https://github.com/your-username" target="_blank">your-username</a>
      </div>
      <div class="mode-selection">
        <button class="mode-btn" data-mode="${GAME_MODES.CLASSIC}">Classic Mode</button>
        <button class="mode-btn" data-mode="${GAME_MODES.RANDOM}">Random Mode</button>
        <button class="mode-btn" data-mode="${GAME_MODES.CHAOTIC}">Chaotic Mode</button>
      </div>
      <button class="continue-btn" id="continueBtn" ${canContinue ? '' : 'disabled'}>
        Continue Game
      </button>
      <div class="settings-buttons">
        <button class="settings-btn" id="settingsBtn">Settings</button>
        <button class="results-btn" id="resultsBtn">Results</button>
      </div>
    </div>
  `;

  setupStartScreenListeners();
}

function setupStartScreenListeners() {
  const modeButtons = document.querySelectorAll('.mode-btn');
  for (const btn of modeButtons) {
    btn.addEventListener('click', (e) => {
      const mode = e.target.dataset.mode;
      playSound('select');
      startNewGame(mode);
    });
  }

  const continueBtn = document.getElementById('continueBtn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      playSound('select');
      continueGame();
    });
  }

  document.getElementById('settingsBtn').addEventListener('click', () => {
    playSound('select');
    showSettingsScreen();
  });

  document.getElementById('resultsBtn').addEventListener('click', () => {
    playSound('select');
    showResultsScreen();
  });
}

function startNewGame(mode) {
  currentGame = {
    mode,
    score: 0,
    grid: generateInitialGrid(mode),
    selectedCells: [],
    assists: {
      addNumbers: ASSIST_LIMITS.ADD_NUMBERS,
      shuffle: ASSIST_LIMITS.SHUFFLE,
      eraser: ASSIST_LIMITS.ERASER,
    },
    startTime: Date.now(),
    moves: [],
    lastState: null,
    eraserMode: false,
  };

  startTimer();
  createGameScreen(currentGame);
}

function continueGame() {
  const savedGame = loadGameState();
  if (savedGame) {
    currentGame = savedGame;
    startTimer();
    createGameScreen(currentGame);
  }
}

function startTimer() {
  if (gameTimer) {
    clearInterval(gameTimer);
  }

  startTime = currentGame.startTime;
  gameTimer = setInterval(updateTimer, 1000);
  updateTimer();
}

function updateTimer() {
  const timerElement = document.getElementById('gameTimer');
  if (timerElement && startTime) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

function stopTimer() {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
}

export function handleCellClick(index) {
  if (!currentGame) return;

  const game = currentGame;

  if (game.eraserMode) {
    if (game.grid[index] !== null) {
      playSound('assist');
      game.grid[index] = null;
      game.assists.eraser--;
      game.eraserMode = false;
      game.lastState = createGameSnapshot();
      updateGameState();
      checkGameEnd();
      showNotification('Number removed!', 'success');
    }
    return;
  }

  if (game.selectedCells.includes(index)) {
    game.selectedCells = game.selectedCells.filter((i) => i !== index);
    playSound('deselect');
    updateGameState();
    return;
  }

  if (game.grid[index] === null) {
    return;
  }

  if (game.selectedCells.length < 2) {
    game.selectedCells.push(index);
    playSound('select');

    if (game.selectedCells.length === 2) {
      setTimeout(
        () => checkPair(game.selectedCells[0], game.selectedCells[1]),
        300
      );
    }

    updateGameState();
  }
}

function checkPair(index1, index2) {
  const game = currentGame;
  const number1 = game.grid[index1];
  const number2 = game.grid[index2];

  if (!isValidNumberPair(number1, number2) || !canConnect(index1, index2)) {
    playSound('invalid');
    game.selectedCells = [];
    updateGameState();
    return;
  }

  playSound('valid');

  let points = 0;
  if (number1 === number2) {
    points = number1 === 5 ? SCORE_RULES.DOUBLE_FIVE : SCORE_RULES.IDENTICAL;
  } else {
    points = SCORE_RULES.SUM_TO_TEN;
  }

  game.lastState = createGameSnapshot();

  game.grid[index1] = null;
  game.grid[index2] = null;
  game.score += points;
  game.selectedCells = [];
  game.moves.push({ index1, index2, points });

  updateGameState();
  checkGameEnd();

  const moveType = number1 === number2 ? 'identical numbers' : 'sum to 10';
  showNotification(`+${points} points! ${moveType}`, 'success');
}

function checkGameEnd() {
  const game = currentGame;

  if (game.score >= GRID_CONFIG.TARGET_SCORE) {
    endGame(true);
    return;
  }

  const currentLines = Math.ceil(game.grid.length / 9);
  if (currentLines >= GRID_CONFIG.MAX_LINES) {
    endGame(false);
    return;
  }

  const validMoves = countValidMoves();
  if (validMoves === 0) {
    if (
      game.assists.addNumbers === 0 &&
      game.assists.shuffle === 0 &&
      game.assists.eraser === 0
    ) {
      endGame(false);
    }
  }
}

function endGame(isWin) {
  stopTimer();
  playSound(isWin ? 'win' : 'lose');

  const game = currentGame;
  const endTime = Date.now();
  const timeElapsed = Math.floor((endTime - game.startTime) / 1000);
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const result = {
    mode: game.mode,
    score: game.score,
    outcome: isWin ? 'win' : 'lose',
    time: timeString,
    moves: game.moves.length,
    timestamp: Date.now(),
  };

  saveResult(result);

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="game-over-screen">
      <h2>Game ${isWin ? 'Won!' : 'Over'}</h2>
      <div class="result-details">
        <p>Score: ${game.score} / ${GRID_CONFIG.TARGET_SCORE}</p>
        <p>Time: ${timeString}</p>
        <p>Moves: ${game.moves.length}</p>
        <p>Mode: ${game.mode.charAt(0).toUpperCase() + game.mode.slice(1)}</p>
      </div>
      <div class="game-over-buttons">
        <button class="play-again-btn">Play Again</button>
        <button class="menu-btn">Main Menu</button>
        <button class="results-btn">View Results</button>
      </div>
    </div>
  `;

  document.querySelector('.play-again-btn').addEventListener('click', () => {
    playSound('select');
    startNewGame(game.mode);
  });

  document.querySelector('.menu-btn').addEventListener('click', () => {
    playSound('select');
    showStartScreen();
  });

  document.querySelector('.results-btn').addEventListener('click', () => {
    playSound('select');
    showResultsScreen();
  });

  currentGame = null;
  saveGameState(null);
}

export function useHint() {
  const game = currentGame;
  if (!game) return;

  playSound('assist');
  const validMoves = countValidMoves();
  showHintModal(validMoves);
  showVisualHints();
}

export function useRevert() {
  const game = currentGame;
  if (!game || !game.lastState) return;

  playSound('assist');
  currentGame = { ...game.lastState };
  updateGameState();
  showNotification('Last move reverted!', 'success');
}

export function useAddNumbers() {
  const game = currentGame;
  if (!game || game.assists.addNumbers <= 0) return;

  const currentLines = Math.ceil(game.grid.length / 9);
  if (currentLines >= GRID_CONFIG.MAX_LINES) {
    showNotification('Maximum grid size reached!', 'warning');
    return;
  }

  playSound('assist');
  game.lastState = createGameSnapshot();

  const remainingNumbers = game.grid.filter((cell) => cell !== null);
  const newNumbers = generateAdditionalNumbers(game.mode, remainingNumbers);

  if (newNumbers.length === 0) {
    showNotification('No numbers to add!', 'warning');
    return;
  }

  game.grid = [...game.grid, ...newNumbers];
  game.assists.addNumbers--;

  updateGameState();
  checkGameEnd();

  showNotification(`Added ${newNumbers.length} new numbers!`, 'success');
}

export function useShuffle() {
  const game = currentGame;
  if (!game || game.assists.shuffle <= 0) return;

  playSound('assist');
  game.lastState = createGameSnapshot();

  const numbers = game.grid.filter((cell) => cell !== null);

  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  let numIndex = 0;
  for (let i = 0; i < game.grid.length; i++) {
    if (game.grid[i] !== null) {
      game.grid[i] = numbers[numIndex];
      numIndex++;
    }
  }

  game.assists.shuffle--;
  updateGameState();
  showNotification('Numbers shuffled!', 'success');
}

export function useEraser() {
  const game = currentGame;
  if (!game || game.assists.eraser <= 0) return;

  playSound('assist');
  game.eraserMode = true;
  updateGameState();
  showNotification('Click on any number to remove it', 'info');
}

function createGameSnapshot() {
  const game = currentGame;
  return {
    grid: [...game.grid],
    score: game.score,
    assists: { ...game.assists },
    selectedCells: [...game.selectedCells],
    moves: [...game.moves],
    eraserMode: game.eraserMode,
  };
}

export function updateGameState() {
  if (currentGame) {
    saveGameState(currentGame);
  }
  if (document.getElementById('gameScreen')) {
    createGameScreen(currentGame);
  }
}

export function getCurrentGame() {
  return currentGame;
}

export function resetGame() {
  if (currentGame) {
    playSound('select');
    startNewGame(currentGame.mode);
  }
}

export function saveCurrentGame() {
  if (currentGame) {
    playSound('assist');
    saveGameState(currentGame);
    showNotification('Game saved successfully!', 'success');
  }
}

export function toggleTheme() {
  const currentTheme =
    document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  applyTheme(newTheme);
  saveSettings({ theme: newTheme, sound: isAudioEnabled() });
}

export function toggleAudio() {
  const newState = !isAudioEnabled();
  setAudioEnabled(newState);
  saveSettings({ theme: currentTheme, sound: newState });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function generateInitialGrid(mode) {
  switch (mode) {
    case GAME_MODES.CLASSIC:
      return [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 1, 1, 2, 1, 3, 1, 4, 1, 5, 1, 6, 1, 7, 1,
        8, 1, 9,
      ];
    case GAME_MODES.RANDOM: {
      const randomGrid = [];
      for (let i = 0; i < 27; i++) {
        randomGrid.push(Math.floor(Math.random() * 9) + 1);
      }
      return randomGrid;
    }
    case GAME_MODES.CHAOTIC: {
      const chaoticGrid = [];
      for (let i = 0; i < 27; i++) {
        chaoticGrid.push(Math.floor(Math.random() * 9) + 1);
      }
      return chaoticGrid;
    }
    default:
      return [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 1, 1, 2, 1, 3, 1, 4, 1, 5, 1, 6, 1, 7, 1,
        8, 1, 9,
      ];
  }
}

function generateAdditionalNumbers(mode, remainingNumbers) {
  const newNumbers = [];
  const remainingCount = remainingNumbers.length;

  switch (mode) {
    case GAME_MODES.CLASSIC:
      for (let i = 0; i < remainingCount; i++) {
        newNumbers.push(remainingNumbers[i]);
      }
      break;
    case GAME_MODES.RANDOM: {
      const shuffled = [...remainingNumbers];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      for (let i = 0; i < remainingCount; i++) {
        newNumbers.push(shuffled[i]);
      }
      break;
    }
    case GAME_MODES.CHAOTIC:
      for (let i = 0; i < remainingCount; i++) {
        newNumbers.push(Math.floor(Math.random() * 9) + 1);
      }
      break;
  }

  return newNumbers;
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? 'var(--success-color)' : type === 'warning' ? 'var(--warning-color)' : 'var(--accent-color)'};
    color: white;
    border-radius: 8px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}
