export const GAME_MODES = {
  CLASSIC: 'classic',
  RANDOM: 'random',
  CHAOTIC: 'chaotic',
};

export const GRID_CONFIG = {
  COLUMNS: 9,
  TARGET_SCORE: 100,
  MAX_LINES: 50,
};

export const SCORE_RULES = {
  IDENTICAL: 1,
  SUM_TO_TEN: 2,
  DOUBLE_FIVE: 3,
};

export const ASSIST_LIMITS = {
  ADD_NUMBERS: 10,
  SHUFFLE: 5,
  ERASER: 5,
};

export const SOUND_TYPES = {
  SELECT: 'select',
  DESELECT: 'deselect',
  VALID_PAIR: 'valid',
  INVALID_PAIR: 'invalid',
  ASSIST: 'assist',
  WIN: 'win',
  LOSE: 'lose',
};
