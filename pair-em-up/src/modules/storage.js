const STORAGE_KEYS = {
  GAME_STATE: 'pairEmUp_gameState',
  SETTINGS: 'pairEmUp_settings',
  RESULTS: 'pairEmUp_results',
};

export function saveGameState(gameState) {
  try {
    if (gameState) {
      localStorage.setItem(
        STORAGE_KEYS.GAME_STATE,
        JSON.stringify({
          ...gameState,
          saveTime: Date.now(),
        })
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    }
    return true;
  } catch (error) {
    console.error('Failed to save game state:', error);
    return false;
  }
}

export function loadGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
    if (!saved) return null;

    const gameState = JSON.parse(saved);
    // Проверяем, не устарело ли сохранение (больше 1 дня)
    if (
      gameState.saveTime &&
      Date.now() - gameState.saveTime > 24 * 60 * 60 * 1000
    ) {
      localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
      return null;
    }

    return gameState;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        ...settings,
        saveTime: Date.now(),
      })
    );
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

export function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!saved) return { theme: 'light', sound: true };

    const settings = JSON.parse(saved);
    return {
      theme: settings.theme || 'light',
      sound: settings.sound !== false,
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { theme: 'light', sound: true };
  }
}

export function saveResult(result) {
  try {
    const results = loadResults();

    // Добавляем новый результат
    results.unshift({
      ...result,
      id: Date.now(), // Уникальный ID для сортировки
    });

    // Сортируем по времени и оставляем только последние 5
    const limitedResults = results
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(limitedResults));
    return true;
  } catch (error) {
    console.error('Failed to save result:', error);
    return false;
  }
}

export function loadResults() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.RESULTS);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load results:', error);
    return [];
  }
}
