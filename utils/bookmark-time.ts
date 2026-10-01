export function formatTimestamp(timestamp: number): string {
  const hours = Math.floor(timestamp / 3600);
  const minutes = Math.floor(timestamp / 60) % 60;
  const seconds = String(timestamp % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`;
}

export function canAdjustTimestamp(timestamp: number, step: number, duration: number | null): boolean {
  if (duration === null || !Number.isFinite(duration) || duration < 0)
    return false;

  const target = timestamp + step;
  return Number.isSafeInteger(target) && target >= 0 && target <= Math.floor(duration);
}
