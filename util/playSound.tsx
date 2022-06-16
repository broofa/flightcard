//
// Simple API for playing sounds
//

// Sound files created at https://ttsmp3.com/
// @ts-expect-error parcel knows how to find this resource
export { default as RANGE_CLOSED } from 'url:../sounds/rangeClosed.mp3';
// @ts-expect-error parcel knows how to find this resource
export { default as RANGE_OPEN } from 'url:../sounds/rangeOpen.mp3';

export const _sndCache = new Map<string, HTMLAudioElement>();
export let _activeSound : HTMLAudioElement;

export function playSound(soundUrl : string) {
  _activeSound?.pause();

  const snd = _sndCache.get(soundUrl) ?? new Audio(soundUrl);
  _sndCache.set(soundUrl, snd);

  snd.currentTime = 0;
  snd.play();
}
