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

export function sortArray<T>(arr : T[], extractor) : T[] {
  const comparator = typeof extractor == 'string'
    ? function(a, b) {
      a = a[extractor];
      b = b[extractor];
      return a < b ? -1 : a > b ? 1 : 0;
    }
    : function(a, b) {
      a = extractor(a);
      b = extractor(b);
      return a < b ? -1 : a > b ? 1 : 0;
    };

  return arr.sort(comparator);
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
export function playSound(soundUrl, init = false) {
  if (!init) _activeSound?.pause();
  if (!_sndCache[soundUrl]) _sndCache[soundUrl] = new Audio(soundUrl);
  const snd = _sndCache[soundUrl] as HTMLAudioElement;
  if (init) {
    const stop = () => {
      snd.pause();
      snd.removeEventListener('canplay', stop);
    };
    snd.addEventListener('canplay', stop);
  } else {
    _activeSound = snd;
  }
  snd.currentTime = 0;
  snd.play();
}
