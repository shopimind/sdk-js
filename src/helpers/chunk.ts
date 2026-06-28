/** Split an array into sub-arrays of at most `size` items. */
export function chunk<T>(array: T[], size: number): T[][] {
  if (!Array.isArray(array) || !Number.isFinite(size) || size <= 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}
