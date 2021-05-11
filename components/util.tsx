import React, { useEffect, useRef } from 'react';

export type tProps = React.HTMLAttributes<any>;
export type tChildren = tChildren[] | React.ReactElement | string | null | undefined;

export function usePrevious<T>(value : T) {
  const ref = useRef<T>();
  useEffect(() => { ref.current = value; });
  return ref.current as T;
}

export function Loading({ wat, ...props } : {wat : string} & tProps) {
  return <div {...props}>Loading {wat}</div>;
}

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

//
// Simple API for playing sounds
//

// Sound files created at https://ttsmp3.com/
// @ts-expect-error parcel knows how to find this resource
export { default as CLOSE_SOUND } from 'url:../sounds/rangeClosed.mp3';
// @ts-expect-error parcel knows how to find this resource
export { default as OPEN_SOUND } from 'url:../sounds/rangeOpen.mp3';

const _sndCache = {};
let _activeSound : HTMLAudioElement;
export function playSound(soundUrl) {
  _activeSound?.pause();

  if (!_sndCache[soundUrl]) _sndCache[soundUrl] = new Audio(soundUrl);
  const snd = _activeSound = _sndCache[soundUrl] as HTMLAudioElement;
  snd.currentTime = 0;
  snd.play();
}

//
// Unit conversion utility
//

export function unitParse(str : string) {
  str = str.trim();
  let v = parseFloat(str);

  if (/^([\d-.]+)\s*(?:ft|')$/i.test(str)) { // feet
    v = parseFloat(RegExp.$1) * 0.3048;
  } else if (/^([\d-.]+)\s*(?:in|")$/i.test(str)) { // inches
    v = parseFloat(RegExp.$1) * 0.0254;
  } else if (/^([\d-.]+)\s*(?:ft|')\s*([\d-.]+)\s*(?:in|")$/i.test(str)) { // feet-inches
    v = parseFloat(RegExp.$1) * 0.3048 + parseFloat(RegExp.$2) * 0.0254;
  } else if (/^([\d-.]+)\s*cm$/i.test(str)) { // centimeters
    v = parseFloat(RegExp.$1) * 0.01;
  } else if (/^([\d-.]+)\s*mm$/i.test(str)) { // millimeters
    v = parseFloat(RegExp.$1) * 0.001;
  } else if (/^([\d-.]+)\s*(?:lb)$/i.test(str)) { // pounds (mass)
    v = parseFloat(RegExp.$1) * 0.453592;
  } else if (/^([\d-.]+)\s*(?:oz)$/i.test(str)) { // ounces
    v = parseFloat(RegExp.$1) * 0.0283495;
  } else if (/^([\d-.]+)\s*(?:lb)\s*([\d-.]+)\s*(?:oz)$/i.test(str)) { // pound - ounces;
    v = parseFloat(RegExp.$1) * 0.453592 + parseFloat(RegExp.$2) * 0.0283495;
  } else if (/^([\d-.]+)\s*(?:gm)$/i.test(str)) { // grams
    v = parseFloat(RegExp.$1) * 0.001;
  } else if (/^([\d-.]+)\s*(?:lbf|lbf-s|lbf-sec|lbf-sec?)$/i.test(str)) { // pounds (force), pounds(force)-seconds
    v = parseFloat(RegExp.$1) * 4.44822;
  } else if (/^([\d-.]+)\s*(?:m|kg|n|n-s|n-secs)$/i.test(str)) { // MKS units
    v = parseFloat(RegExp.$1);
  }

  return v;
}
