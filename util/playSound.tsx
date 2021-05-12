//
// Simple API for playing sounds
//

// Sound files created at https://ttsmp3.com/
// @ts-expect-error parcel knows how to find this resource
export { default as RANGE_CLOSED } from 'url:../sounds/rangeClosed.mp3';
// @ts-expect-error parcel knows how to find this resource
export { default as RANGE_OPEN } from 'url:../sounds/rangeOpen.mp3';

export const _sndCache = {};
export let _activeSound : HTMLAudioElement;

export function playSound(soundUrl) {
  _activeSound?.pause();

  if (!_sndCache[soundUrl]) { _sndCache[soundUrl] = new Audio(soundUrl); }
  const snd = _activeSound = _sndCache[soundUrl] as HTMLAudioElement;
  snd.currentTime = 0;
  snd.play();
}
