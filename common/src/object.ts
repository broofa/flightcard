/**
 * Shallow compare two objects
 */
export function objectEqual(
  o1: Record<string, unknown>,
  o2: Record<string, unknown>
) {
  const entries1 = Object.entries(o1);
  const entries2 = Object.entries(o2);
  if (entries1.length !== entries2.length) return false;
  for (const [key, value] of entries1) {
    if (o2[key] !== value) return false;
  }

  return true;
}

export function objectEmpty(obj: Record<string, unknown>) {
  return Object.keys(obj).length === 0;
}
