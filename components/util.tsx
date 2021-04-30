import { iUser } from '../types';
import React, { useRef, useEffect } from 'react';
import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';

const db = {};

export function Loading({ wat, ...props }) {
  return <div {...props}>Loading {wat}</div>;
}

export function usePrevious<T>(value : T) {
  const ref = useRef<T>();
  useEffect(() => { ref.current = value; });
  return ref.current as T;
}

//
// Simple API for playing sounds
//

// Sound files created at https://ttsmp3.com/ (US English/Salli voice)
export { default as OPEN_SOUND } from 'url:../sounds/rangeOpen.mp3';
export { default as CLOSE_SOUND } from 'url:../sounds/rangeClosed.mp3';

const _sndCache = {};
let _activeSound : typeof Audio | undefined;
export function playSound(soundUrl) {
  if (_activeSound) _activeSound.pause();

  if (!_sndCache[soundUrl]) _sndCache[soundUrl] = new Audio(soundUrl);
  const snd = _activeSound = _sndCache[soundUrl];
  snd.currentTime = 0;
  snd.play();
}
