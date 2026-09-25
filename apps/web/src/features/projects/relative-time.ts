const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

/** "5 minutes ago" so comment and activity stamps read at a glance. */
export function formatRelativeTime(iso: string): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return iso;

  const elapsed = timestamp - Date.now();
  for (const [unit, milliseconds] of UNITS) {
    if (Math.abs(elapsed) >= milliseconds) {
      return relativeTime.format(Math.round(elapsed / milliseconds), unit);
    }
  }
  return "just now";
}
