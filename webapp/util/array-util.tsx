// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Comparable = any;

export function arraySort<T>(
  arr: T[],
  extract: string | ((item: T) => Comparable)
): T[] {
  let extractor: (item: T) => Comparable;

  if (typeof extract === 'string') {
    const prop = extract;
    extractor = (item: T) =>
      (item as unknown as { [k: string]: Comparable })[prop];
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

function _arrayGroupPush<ItemType, KeyType>(
  groups: Map<KeyType, ItemType[]>,
  key: KeyType,
  item: ItemType
) {
  let group = groups.get(key);
  if (group == null) groups.set(key, (group = []));
  group.push(item);
}

export function arrayGroup<KeyType, ItemType>(
  arr: ItemType[],
  extract: (item: ItemType) => KeyType | KeyType[]
) {
  const itemsByGroup = new Map<KeyType, ItemType[]>();

  if (typeof extract === 'string') {
    return arrayGroup(arr, (item) => item[extract] as KeyType);
  }

  for (const v of arr) {
    const keys = extract(v);
    if (keys == null) throw Error('Null or undefined group key');
    if (!Array.isArray(keys)) {
      _arrayGroupPush(itemsByGroup, keys, v);
    } else {
      for (const key of keys) {
        _arrayGroupPush<ItemType, KeyType>(itemsByGroup, key, v);
      }
    }
  }

  return itemsByGroup;
}
