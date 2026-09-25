/** Message to show a user for a failed call; null when nothing failed. */
export function getErrorMessage(error: unknown, fallback: string): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : fallback;
}
