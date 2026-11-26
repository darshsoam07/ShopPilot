/** Keeps the first item for each id. API lists that repeat an id would otherwise produce duplicate React keys. */
export function dedupeById<T extends { id: number | string }>(items: readonly T[]): T[] {
  const seen = new Set<number | string>();
  return items.filter(item => (seen.has(item.id) ? false : (seen.add(item.id), true)));
}
