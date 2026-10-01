export function formatTime(secondsOrMs: number, isMs = false): string {
  const totalSeconds = Math.floor(isMs ? secondsOrMs / 1000 : secondsOrMs);
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00';

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
