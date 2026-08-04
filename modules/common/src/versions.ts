/**
 * Compare two versions by their numeric parts: `4.10.0` is newer than `4.9.0`, which a plain string comparison
 * gets backwards — and getting it backwards on `minVersion` means either locking out the app or failing to.
 * Negative if `a` is older than `b`, zero if they match, positive if `a` is newer. Missing parts count as zero,
 * so `4.6` and `4.6.0` are the same version.
 */
export const compareVersions = (a: string, b: string): number => {
  const partsOf = (version: string): number[] =>
    String(version ?? '')
      .split('.')
      .map(part => Number.parseInt(part, 10) || 0);

  const [aParts, bParts] = [partsOf(a), partsOf(b)];
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const difference = (aParts[i] ?? 0) - (bParts[i] ?? 0);
    if (difference) return difference;
  }
  return 0;
};
