export function playHrNotificationTone() {
  if (typeof window === "undefined" || !window.AudioContext) return;

  const context = new window.AudioContext();
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  const now = context.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.setValueAtTime(660, now + 0.14);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(0.12, now + 0.025);
  volume.gain.setValueAtTime(0.12, now + 0.14);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.onended = () => void context.close();
  oscillator.start(now);
  oscillator.stop(now + 0.32);
}
