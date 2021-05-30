
export function sortArray<T = any>(arr : T[], extractor : string | ((a : T) => any)) : T[] {
  const comparator = typeof extractor == 'string'
    ? function(a : any, b : any) {
      a = a[extractor];
      b = b[extractor];
      return a < b ? -1 : a > b ? 1 : 0;
    }
    : function(a, b) {
      a = extractor(a);
      b = extractor(b);
      return a < b ? -1 : a > b ? 1 : 0;
    };

  arr.sort(comparator);

  return arr;
}
