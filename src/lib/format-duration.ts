const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE

/** "45s", "4m", "4m 12s", "1h 5m". Seconds are dropped once the duration reaches an hour. */
export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds))

  if (seconds < SECONDS_PER_MINUTE) return `${seconds}s`

  const hours = Math.floor(seconds / SECONDS_PER_HOUR)
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
  const remainingSeconds = seconds % SECONDS_PER_MINUTE

  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`

  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`
}
