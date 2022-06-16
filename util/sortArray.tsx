// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Comparable = any;

export function sortArray<T>(
  arr: T[],
  extract: string | ((item: T) => Comparable)
): T[] {
  let extractor: (item: T) => Comparable;

  if (typeof extract === 'string') {
    const prop = extract;
    extractor = function (item: T) {
      return (item as unknown as { [k: string]: Comparable })[prop];
    };
  }

  function comparator(a: T, b: T) {
    const av = extractor(a);
    const bv = extractor(b);
    return av < bv ? -1 : av > bv ? 1 : 0;
  }

  arr.sort(comparator);

  return arr;
}
