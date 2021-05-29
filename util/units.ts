//
// Unit conversion utility
//

export type tUnitSystemName = 'mks' | 'uscs';

export type tUnitSystem = {
  length : string,
  smallLength : string,
  mass : string,
  force : string,
  impulse : string
 };

export const MKS : tUnitSystem = {
  length: 'm',
  smallLength: 'cm',
  mass: 'kg',
  force: 'n',
  impulse: 'n-s'
};

export const USCS : tUnitSystem = {
  length: 'ft',
  smallLength: 'in',
  mass: 'lb',
  force: 'lbf',
  impulse: 'lbf-s'
};

// Map of maps of conversion factors ([from][to] = conversion value)
const _FACTORS = new Map<string, Map<string, number>>();

// Define a conversion factor between `from` and `to` units.
//
// This method defines the inverse conversion as well as any implied
// conversions.  For example...
//
// _defineConversion('m', 'mm', 1000); _defineConversion('in', mm', 25.4);
//
// ... enables conversions to and from any combination of 'm', 'mm', and 'in'
// units.
//
// Note: The _FACTORS data structure grows as O(N * (N-1)) for N related units.
// Something to keep an eye on.
function _defineConversion(from : string, to : string, val : number) {
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
  fromFactors.set(to, val);

  // Define inverse conversion
  _defineConversion(to, from, 1 / val);

  // Define conversions for all units that `to` can convert to.  This results in
  // a fully populated conversion table for all related units.
  const toFactors = _FACTORS.get(to);
  if (toFactors) {
    for (const toto of toFactors.keys()) { // https://www.youtube.com/watch?v=FTQbiNvZqaY
      _defineConversion(from, toto, val * toFactors.get(toto));
    }
  }
}

// Length
_defineConversion('ft', 'in', 12);
_defineConversion('m', 'cm', 100);
_defineConversion('cm', 'mm', 10);
_defineConversion('km', 'm', 1000);
_defineConversion('in', 'mm', 25.4); // Connect MKS <-> USCS lengths

// Mass
_defineConversion('kg', 'g', 1000);
_defineConversion('g', 'mg', 1000);
_defineConversion('lb', 'oz', 16);
_defineConversion('kg', 'lb', 2.20462262); // Connect MKS <-> USCS mass

// Force (thrust)
_defineConversion('lbf', 'n', 4.44822);

// Impulse
_defineConversion('lbf-s', 'n-s', 4.44822);

export function unitConvert(val : number | undefined, from : string, to : string) {
  if (val === undefined || typeof (val) != 'number' || from === to) return val;

  const factor = _FACTORS.get(from)?.get(to);

  if (factor == null) throw Error(`Can't convert ${from} to ${to}`);

  return val * factor;
}

export function unitParse(val : any, targetUnit : string) : number | undefined {
  if (val == null || val == '') return undefined;

  if (val?.trim) val = val.trim();

  let v, unit;

  if (/^([\d-.]+)\s*(?:ft|')$/i.test(val)) { // feet
    v = Number(RegExp.$1);
    unit = 'ft';
  } else if (/^([\d-.]+)\s*(?:in|")$/i.test(val)) { // inches
    v = Number(RegExp.$1) / 12;
    unit = 'ft';
  } else if (/^([\d-.]+)\s*(?:ft|')\s*([\d-.]+)\s*(?:in|")$/i.test(val)) { // feet-inches
    v = Number(RegExp.$1) + Number(RegExp.$2) / 12;
    unit = 'ft';
  } else if (/^([\d-.]+)\s*cm$/i.test(val)) { // centimeters
    v = Number(RegExp.$1) / 100;
    unit = 'm';
  } else if (/^([\d-.]+)\s*mm$/i.test(val)) { // millimeters
    v = Number(RegExp.$1) / 1000;
    unit = 'm';
  } else if (/^([\d-.]+)\s*(?:lb)$/i.test(val)) { // pounds (mass)
    v = Number(RegExp.$1);
    unit = 'lb';
  } else if (/^([\d-.]+)\s*(?:oz)$/i.test(val)) { // ounces
    v = Number(RegExp.$1) / 16;
    unit = 'lb';
  } else if (/^([\d-.]+)\s*(?:lb)\s*([\d-.]+)\s*(?:oz)$/i.test(val)) { // pound - ounces;
    v = Number(RegExp.$1) + Number(RegExp.$2) / 16;
    unit = 'lb';
  } else if (/^([\d-.]+)\s*(?:g)$/i.test(val)) { // grams
    v = Number(RegExp.$1) / 1000;
    unit = 'kg';
  } else if (/^([\d-.]+)\s*(?:lbf)$/i.test(val)) { // lbf
    v = Number(RegExp.$1);
    unit = 'lbf';
  } else if (/^([\d-.]+)\s*(?:lbf-s|lbf-sec)$/i.test(val)) { // lbf-seconds
    v = Number(RegExp.$1);
    unit = 'lbf-s';
  } else if (/^([\d-.]+)\s*(?:m)$/i.test(val)) { // m
    v = Number(RegExp.$1);
    unit = 'm';
  } else if (/^([\d-.]+)\s*(?:kg)$/i.test(val)) { // kg
    v = Number(RegExp.$1);
    unit = 'kg';
  } else if (/^([\d-.]+)\s*(?:n)$/i.test(val)) { // newton
    v = Number(RegExp.$1);
    unit = 'n';
  } else if (/^([\d-.]+)\s*(?:n-s|n-sec)$/i.test(val)) { // newton-sec
    v = Number(RegExp.$1);
    unit = 'n-s';
  } else {
    v = Number(val);
    unit = targetUnit;
  }

  if (isNaN(v)) throw Error(`Unable to parse "${val}" as a number`);

  v = unitConvert(v, unit, targetUnit);

  return v;
}
