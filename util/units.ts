//
// Unit conversion utility
//

export function unitParse(val : any, fieldName ?: string) : number | undefined {
  if (val == null || val == '') return undefined;

  if (val?.trim) val = val.trim();

  let v = Number(val);

  if (/^([\d-.]+)\s*(?:ft|')$/i.test(val)) { // feet
    v = Number(RegExp.$1) * 0.3048;
  } else if (/^([\d-.]+)\s*(?:in|")$/i.test(val)) { // inches
    v = Number(RegExp.$1) * 0.0254;
  } else if (/^([\d-.]+)\s*(?:ft|')\s*([\d-.]+)\s*(?:in|")$/i.test(val)) { // feet-inches
    v = Number(RegExp.$1) * 0.3048 + Number(RegExp.$2) * 0.0254;
  } else if (/^([\d-.]+)\s*cm$/i.test(val)) { // centimeters
    v = Number(RegExp.$1) * 0.01;
  } else if (/^([\d-.]+)\s*mm$/i.test(val)) { // millimeters
    v = Number(RegExp.$1) * 0.001;
  } else if (/^([\d-.]+)\s*(?:lb)$/i.test(val)) { // pounds (mass)
    v = Number(RegExp.$1) * 0.453592;
  } else if (/^([\d-.]+)\s*(?:oz)$/i.test(val)) { // ounces
    v = Number(RegExp.$1) * 0.0283495;
  } else if (/^([\d-.]+)\s*(?:lb)\s*([\d-.]+)\s*(?:oz)$/i.test(val)) { // pound - ounces;
    v = Number(RegExp.$1) * 0.453592 + Number(RegExp.$2) * 0.0283495;
  } else if (/^([\d-.]+)\s*(?:gm)$/i.test(val)) { // grams
    v = Number(RegExp.$1) * 0.001;
  } else if (/^([\d-.]+)\s*(?:lbf|lbf-s|lbf-sec?)$/i.test(val)) { // pounds (force), pounds(force)-seconds
    v = Number(RegExp.$1) * 4.44822;
  } else if (/^([\d-.]+)\s*(?:m|kg|n|n-s|n-sec)$/i.test(val)) { // MKS units
    v = Number(RegExp.$1);
  }

  if (fieldName && isNaN(v)) throw Error(`${fieldName} value "${val}" is invalid`);

  return v;
}
