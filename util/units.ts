//
// Unit conversion utility
//

export type tUnitSystemName = 'mks' | 'uscs';

export type tUnitSystem = {
  lengthSmall: string;
  length: string;
  speed: string;
  speedSmall: string;
  mass: string;
  force: string;
  impulse: string;
};

export const MKS: tUnitSystem = {
  lengthSmall: 'cm',
  length: 'm',
  speed: 'km/h',
  speedSmall: 'm/s',
  mass: 'kg',
  force: 'n',
  impulse: 'n-s',
};

export const USCS: tUnitSystem = {
  lengthSmall: 'in',
  length: 'ft',
  speed: 'mph',
  speedSmall: 'ft/s',
  mass: 'lb',
  force: 'lbf',
  impulse: 'lbf-s',
};

// Map of maps of conversion factors ([from][to] = conversion value)
const _FACTORS = new Map<string, Map<string, number>>();

// Define a conversion factor between `from` and `to` units.
//
// This method defines the inverse conversion as well as any implied
// conversions.  For example...
//
// define('m', 'mm', 1000); define('in', mm', 25.4);
//
// ... enables conversions to and from any combination of 'm', 'mm', and 'in'
// units.
//
// Note: The _FACTORS data structure grows as O(N * (N-1)) for N related units.
// Something to keep an eye on.
function define(from: string, to: string, factor: number) {
  if (from === to) return;

  // Define the conversion and inverse conversion
  let fromFactors = _FACTORS.get(from);
  if (!fromFactors) {
    fromFactors = new Map<string, number>();
    _FACTORS.set(from, fromFactors);
  } else if (fromFactors.has(to)) {
    // Conversion is already defined
    return;
  }

  // Set conversion factor
  fromFactors.set(to, factor);

  // Define inverse conversion
  define(to, from, 1 / factor);

  // Define conversions for all units that `to` can convert to.  This results in
  // a fully populated conversion table for all related units.
  const toFactors = _FACTORS.get(to);
  if (toFactors) {
    for (const [toto, toFactor] of toFactors) {
      // https://www.youtube.com/watch?v=FTQbiNvZqaY
      define(from, toto, factor * toFactor);
    }
  }
}

// Length
define('ft', 'in', 12);
define('m', 'cm', 100);
define('cm', 'mm', 10);
define('km', 'm', 1000);
define('in', 'mm', 25.4); // Connect MKS <-> USCS lengths

// Speed
define('m/s', 'km/h', 3600 / 1000);
define('m/s', 'km/s', 1 / 1000);
define('ft/s', 'mph', 3600 / 5280);
define('m/s', 'ft/s', 1000 / (25.4 * 12)); // Connect MKS <-> USCS speeds

// Mass
define('kg', 'g', 1000);
define('g', 'mg', 1000);
define('lb', 'oz', 16);
define('kg', 'lb', 2.20462262); // Connect MKS <-> USCS mass

// Force (thrust)
define('lbf', 'n', 4.44822);

// Impulse
define('lbf-s', 'n-s', 4.44822);

export function unitConvert(val: number | string, from: string, to: string) {
  const factor = to === from ? 1 : _FACTORS?.get(from)?.get(to);
  if (factor == null) return NaN;

  return Number(val) * factor;
}

export function unitParse(
  val: string | number,
  defaultUnit: string,
  toUnit = defaultUnit
): number {
  val = typeof val == 'number' ? String(val) : val.trim();

  let v: number, unit: string;

  if (/^([\d-.]+)\s*(?:ft|')$/i.test(val)) {
    // feet
    v = Number(RegExp.$1);
    unit = 'ft';
  } else if (/^([\d-.]+)\s*(?:in|")$/i.test(val)) {
    // inches
    v = Number(RegExp.$1) / 12;
    unit = 'ft';
  } else if (/^([\d-.]+)\s*(?:ft|')\s*([\d-.]+)\s*(?:in|")$/i.test(val)) {
    // feet-inches
    v = Number(RegExp.$1) + Number(RegExp.$2) / 12;
    unit = 'ft';
  } else if (/^([\d-.]+)\s*cm$/i.test(val)) {
    // centimeters
    v = Number(RegExp.$1) / 100;
    unit = 'm';
  } else if (/^([\d-.]+)\s*mm$/i.test(val)) {
    // millimeters
    v = Number(RegExp.$1) / 1000;
    unit = 'm';
  } else if (/^([\d-.]+)\s*(?:lb)$/i.test(val)) {
    // pounds (mass)
    v = Number(RegExp.$1);
    unit = 'lb';
  } else if (/^([\d-.]+)\s*(?:oz)$/i.test(val)) {
    // ounces
    v = Number(RegExp.$1) / 16;
    unit = 'lb';
  } else if (/^([\d-.]+)\s*(?:lb)\s*([\d-.]+)\s*(?:oz)$/i.test(val)) {
    // pound - ounces;
    v = Number(RegExp.$1) + Number(RegExp.$2) / 16;
    unit = 'lb';
  } else if (/^([\d-.]+)\s*(?:gm?)$/i.test(val)) {
    // grams
    v = Number(RegExp.$1) / 1000;
    unit = 'kg';
  } else if (/^([\d-.]+)\s*(?:lbf)$/i.test(val)) {
    // lbf
    v = Number(RegExp.$1);
    unit = 'lbf';
  } else if (/^([\d-.]+)\s*(?:lbf-s|lbf-sec)$/i.test(val)) {
    // lbf-seconds
    v = Number(RegExp.$1);
    unit = 'lbf-s';
  } else if (/^([\d-.]+)\s*(?:m)$/i.test(val)) {
    // m
    v = Number(RegExp.$1);
    unit = 'm';
  } else if (/^([\d-.]+)\s*(?:kg)$/i.test(val)) {
    // kg
    v = Number(RegExp.$1);
    unit = 'kg';
  } else if (/^([\d-.]+)\s*(?:n)$/i.test(val)) {
    // newton
    v = Number(RegExp.$1);
    unit = 'n';
  } else if (/^([\d-.]+)\s*(?:n-s|n-sec)$/i.test(val)) {
    // newton-sec
    v = Number(RegExp.$1);
    unit = 'n-s';
  } else {
    v = Number(val);
    unit = defaultUnit;
  }

  if (isNaN(v)) {
    return NaN;
  }

  v = unitConvert(v, unit, toUnit);

  if (v === undefined) throw Error('');

  return v;
}
