//
// Unit conversion utility
//

const FACTORS = {
  'm:ft': 3.28084,
  'ft:m': 1 / 3.28084,

  'kg:lb': 2.20462262,
  'lb:kg': 1 / 2.20462262,

  'n:lbf': 1 / 4.44822,
  'lbf:n': 4.44822,

  'n-s:lbf-s': 1 / 4.44822,
  'lbf-s:n-s': 4.44822
};

export function unitConvert(val : number | undefined, from : string, to : string) {
  if (val === undefined || from === to) return val;

  const factor = FACTORS[`${from}:${to}`];
  if (factor == null) throw Error(`Unable to convert from ${from} to ${to}`);

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
  } else if (/^([\d-.]+)\s*(?:gm)$/i.test(val)) { // grams
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
