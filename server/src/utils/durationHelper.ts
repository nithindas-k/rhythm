/**
 * Parses an ISO 8601 duration string (e.g. PT3M45S, PT1H2M10S, PT45S) into milliseconds.
 */
export function parseIsoDurationToMs(isoDuration?: string): number {
  if (!isoDuration) return 0;

  const match = isoDuration.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const days = parseInt(match[1] || '0', 10);
  const hours = parseInt(match[2] || '0', 10);
  const minutes = parseInt(match[3] || '0', 10);
  const seconds = parseInt(match[4] || '0', 10);

  return (days * 86400 + hours * 3600 + minutes * 60 + seconds) * 1000;
}
