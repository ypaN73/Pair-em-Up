import { GRID_CONFIG } from '../utils/constants.js';
import { isAudioEnabled } from './audio.js';
import {
  getCurrentGame,
  handleCellClick,
  resetGame,
  saveCurrentGame,
  toggleAudio,
  toggleTheme,
  updateGameState,
  useAddNumbers,
  useEraser,
  useHint,
  useRevert,
  useShuffle,
} from './game.js';
import { showVisualHints } from './modal.js';
import { countValidMoves } from './pairs.js';
import { loadResults } from './storage.js';

export function createGameScreen(game) {
  if (!game) {
    console.error('No game provided to createGameScreen');
    return;
  }

  const progressPercent = Math.min(
    (game.score / GRID_CONFIG.TARGET_SCORE) * 100,
    100
  );

  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="game-screen" id="gameScreen">
      <div class="game-header">
        <div class="game-info">
          <div class="mode-info">Mode: ${game.mode ? game.mode.charAt(0).toUpperCase() + game.mode.slice(1) : 'Unknown'}</div>
          <div class="score">Score: <span id="currentScore">${game.score || 0}</span> / ${GRID_CONFIG.TARGET_SCORE}</div>
          <div class="timer">Time: <span id="gameTimer">00:00</span></div>
        </div>
        <div class="game-controls">
          <button class="control-btn" id="resetBtn">Reset</button>
          <button class="control-btn" id="saveBtn">Save</button>
          <button class="control-btn" id="menuBtn">Menu</button>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="progress-text">${game.score}/${GRID_CONFIG.TARGET_SCORE}</div>
      </div>

      <div class="game-grid" id="gameGrid">
        ${renderGrid(game.grid || [], game.selectedCells || [], game.eraserMode || false)}
      </div>

      <div class="assist-tools">
        <button class="assist-btn" id="hintBtn">
          Hints <span class="counter">${countValidMoves()}</span>
        </button>
        <button class="assist-btn" id="visualHintBtn">
          Show Moves <span class="counter">∞</span>
        </button>
        <button class="assist-btn" id="revertBtn" ${game.lastState ? '' : 'disabled'}>
          Revert <span class="counter">∞</span>
        </button>
        <button class="assist-btn" id="addNumbersBtn" ${game.assists && game.assists.addNumbers > 0 ? '' : 'disabled'}>
          Add Numbers <span class="counter">${game.assists ? game.assists.addNumbers : 0}</span>
        </button>
        <button class="assist-btn" id="shuffleBtn" ${game.assists && game.assists.shuffle > 0 ? '' : 'disabled'}>
          Shuffle <span class="counter">${game.assists ? game.assists.shuffle : 0}</span>
        </button>
        <button class="assist-btn" id="eraserBtn" ${game.assists && game.assists.eraser > 0 ? '' : 'disabled'}>
          Eraser <span class="counter">${game.assists ? game.assists.eraser : 0}</span>
        </button>
      </div>

      ${game.eraserMode ? '<div class="eraser-notice">Click on any number to remove it</div>' : ''}

      <div class="game-footer">
        <button class="settings-btn" id="gameSettingsBtn">Settings</button>
      </div>
    </div>
  `;

  setupGameEventListeners();
}

function renderGrid(grid, selectedCells, eraserMode) {
  let html = '';

  for (let i = 0; i < grid.length; i++) {
    const number = grid[i];
    const isSelected = selectedCells.includes(i);
    const isEraserMode = eraserMode;

    html += `
      <div class="grid-cell ${isSelected ? 'selected' : ''} ${isEraserMode && number !== null ? 'eraser-mode' : ''}"
           data-index="${i}" data-number="${number}"
           title="Position: ${i}, Row: ${Math.floor(i / 9)}, Col: ${i % 9}">
        ${number !== null ? number : ''}
      </div>
    `;
  }

  return html;
}

function setupGameEventListeners() {
  document.getElementById('gameGrid').addEventListener('click', (e) => {
    const cell = e.target.closest('.grid-cell');
    if (!cell) return;

    const index = Number.parseInt(cell.dataset.index);
    handleCellClick(index);
  });

  document.getElementById('resetBtn').addEventListener('click', resetGame);
  document.getElementById('saveBtn').addEventListener('click', saveCurrentGame);
  document.getElementById('menuBtn').addEventListener('click', () => {
    window.location.reload();
  });

  document.getElementById('hintBtn').addEventListener('click', useHint);
  document
    .getElementById('visualHintBtn')
    .addEventListener('click', showVisualHints);
  document.getElementById('revertBtn').addEventListener('click', useRevert);
  document
    .getElementById('addNumbersBtn')
    .addEventListener('click', useAddNumbers);
  document.getElementById('shuffleBtn').addEventListener('click', useShuffle);
  document.getElementById('eraserBtn').addEventListener('click', useEraser);

  document
    .getElementById('gameSettingsBtn')
    .addEventListener('click', showSettingsScreen);
}

export function showSettingsScreen() {
  const app = document.getElementById('app');
  const audioEnabled = isAudioEnabled();
  const currentTheme =
    document.documentElement.getAttribute('data-theme') || 'light';

  app.innerHTML = `
    <div class="settings-screen">
      <h2>Settings</h2>

      <div class="settings-section">
        <h3>Audio</h3>
        <div class="audio-controls">
          <label class="toggle-switch">
            <input type="checkbox" id="soundToggle" ${audioEnabled ? 'checked' : ''}>
            <span class="slider"></span>
            <span class="toggle-label">Sound Effects</span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h3>Theme</h3>
        <div class="theme-controls">
          <button class="theme-btn ${currentTheme === 'light' ? 'active' : ''}" data-theme="light">
            Light Mode
          </button>
          <button class="theme-btn ${currentTheme === 'dark' ? 'active' : ''}" data-theme="dark">
            Dark Mode
          </button>
        </div>
      </div>

      <div class="settings-buttons">
        <button class="back-btn" id="settingsBackBtn">Back</button>
      </div>
    </div>
  `;

  document
    .getElementById('soundToggle')
    .addEventListener('change', toggleAudio);

  const themeButtons = document.querySelectorAll('.theme-btn');
  for (const btn of themeButtons) {
    btn.addEventListener('click', (e) => {
      const selectedTheme = e.target.dataset.theme;
      const currentTheme =
        document.documentElement.getAttribute('data-theme') || 'light';

      if (selectedTheme !== currentTheme) {
        const themeButtons = document.querySelectorAll('.theme-btn');
        for (const b of themeButtons) {
          b.classList.remove('active');
        }
        e.target.classList.add('active');

        applyTheme(selectedTheme);
        saveSettings({ theme: selectedTheme, sound: isAudioEnabled() });
      }
    });
  }

  document.getElementById('settingsBackBtn').addEventListener('click', () => {
    if (getCurrentGame()) {
      createGameScreen(getCurrentGame());
    } else {
      window.location.reload();
    }
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function saveSettings(settings) {
  try {
    localStorage.setItem('pairEmUp_settings', JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

export function showResultsScreen() {
  const results = loadResults();
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="results-screen">
      <h2>Game Results</h2>

      ${
        results.length === 0
          ? '<p class="no-results">No games played yet</p>'
          : `
        <div class="results-table">
          <div class="table-header">
            <span>Mode</span>
            <span>Score</span>
            <span>Time</span>
            <span>Result</span>
          </div>
          ${results
            .map(
              (result) => `
            <div class="table-row ${result.outcome}">
              <span>${result.mode ? result.mode.charAt(0).toUpperCase() + result.mode.slice(1) : 'Unknown'}</span>
              <span>${result.score || 0}</span>
              <span>${result.time || '00:00'}</span>
              <span class="result-badge ${result.outcome}">
                ${result.outcome === 'win' ? '🏆 WIN' : '💀 LOSE'}
              </span>
            </div>
          `
            )
            .join('')}
        </div>
        `
      }

      <div class="results-buttons">
        <button class="back-btn" id="resultsBackBtn">Back</button>
        ${results.length > 0 ? '<button class="clear-btn" id="clearResultsBtn">Clear Results</button>' : ''}
      </div>
    </div>
  `;

  document.getElementById('resultsBackBtn').addEventListener('click', () => {
    if (getCurrentGame()) {
      createGameScreen(getCurrentGame());
    } else {
      window.location.reload();
    }
  });

  if (results.length > 0) {
    document.getElementById('clearResultsBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all results?')) {
        localStorage.removeItem('pairEmUp_results');
        showResultsScreen();
      }
    });
  }
}
