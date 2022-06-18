// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Comparable = any;

export function arraySort<T>(
  arr: T[],
  extract: string | ((item: T) => Comparable)
): T[] {
  let extractor: (item: T) => Comparable;

  if (typeof extract === 'string') {
    const prop = extract;
    extractor = function (item: T) {
      return (item as unknown as { [k: string]: Comparable })[prop];
    };
  } else {
    extractor = extract;
  }

  function comparator(a: T, b: T) {
    const av = extractor(a);
    const bv = extractor(b);
    return av < bv ? -1 : av > bv ? 1 : 0;
  }

  arr.sort(comparator);

  return arr;
}

export function arrayGroup<T>(
  arr: T[],
  extract: string | ((item: T) => Comparable | Comparable[])
): { [key: string]: T[] } {
  let extractor: (item: T) => Comparable | Comparable[];

  if (typeof extract === 'string') {
    const prop = extract;
    extractor = function (item: T) {
      return (item as unknown as { [k: string]: Comparable })[prop];
    };
  } else {
    extractor = extract;
  }

  const obj: { [key: string]: T[] } = {};

  for (const v of arr) {
    let keys = extractor(v);
    if (keys == null) throw Error('Null or undefined group key');
    if (!Array.isArray(keys)) keys = [keys];
    for (const key of keys) {
      if (!(key in obj)) obj[key] = [];
      obj[key].push(v);
    }
  }

  return obj;
}
