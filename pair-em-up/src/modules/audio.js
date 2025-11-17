// Создаем простые тональные звуки вместо base64 заглушек
function createToneSound(frequency, duration) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + duration
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

const sounds = {
  select: { play: () => createToneSound(800, 0.1) },
  deselect: { play: () => createToneSound(400, 0.1) },
  valid: { play: () => createToneSound(1200, 0.3) },
  invalid: { play: () => createToneSound(300, 0.2) },
  assist: { play: () => createToneSound(600, 0.2) },
  win: {
    play: () => {
      createToneSound(1000, 0.2);
      setTimeout(() => createToneSound(1200, 0.2), 200);
      setTimeout(() => createToneSound(1400, 0.3), 400);
    },
  },
  lose: {
    play: () => {
      createToneSound(500, 0.3);
      setTimeout(() => createToneSound(400, 0.2), 300);
      setTimeout(() => createToneSound(300, 0.4), 500);
    },
  },
};

let audioEnabled = true;

export function playSound(soundType) {
  if (!audioEnabled || !sounds[soundType]) return;

  try {
    sounds[soundType].play();
  } catch (error) {
    console.warn('Audio playback error:', error);
  }
}

export function setAudioEnabled(enabled) {
  audioEnabled = enabled;
}

export function isAudioEnabled() {
  return audioEnabled;
}
