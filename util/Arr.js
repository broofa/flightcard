/**
 * map() & filter(), combined.  Returns array of all truthy-values returned by the iterator.
 *
 * @param {Array} arr The target array
 * @param {Function} iterator function(item)
 *
 * @return {Array}
 */
exports.sift = function(arr, iterator) {
  return arr.map(iterator).filter(x => x);
};

/**
 * Sort an array on a property or custom function
 *
 * Example:
 * Arr.sortOn(arr, 'name')
 * Arr.sortOn(arr, x => x.firstName + x.lastName);
 *
 * @param {Array} arr The target array
 * @param {String|Function} Key of value to use, or function(item) that returns
 * the value to use
 *
 * @return {Array}
 */
exports.sortOn = function(arr, extractor) {
  if (!Array.isArray(arr)) return arr;

  if (typeof(extractor) != 'function') {
    const key = extractor;
    extractor = function(o) {
      return o != null && o[key];
    };
  }

  return arr.sort(function(a, b) {
    a = extractor(a);
    b = extractor(b);
    return a < b ? -1 : b < a ? 1 : 0;
  });
};

/**
 * Classify items in an array.
 *
 * Example (single value):
 * Arr.classify(arr, item => item.vendor) // Where x is like `{vendor: 'Fred'}`
 * Arr.classify(arr, 'vendor')            // Shorthand for above
 *
 * Items may be classified into multiple categories by returning an array.
 *
 * Example (
 *
 * @param {Array} arr The target array
 * @param {String|Function} Key of classification value(s), or function(item) that returns
 * the classification value(s)
 *
 * @return {Object} object[category] = [item];
 *
 */
exports.classify = function(arr, extractor) {
  const obj = {};

  if (typeof(extractor) != 'function') {
    const key = extractor;
    extractor = function(o) {
      return o != null && o[key];
    };
  }

  for (const v of arr) {
    let keys = extractor(v);
    if (keys == null) throw Error('Null or undefined key');
    if (!Array.isArray(keys)) keys = [keys];
    for (const key of keys) {
      if (!(key in obj)) obj[key] = [];
      obj[key].push(v);
    }
  }

  return obj;
};
