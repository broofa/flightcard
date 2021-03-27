import { useEffect, useState } from 'react';

const appState = window.appState = new Map();
const listeners = new Set();
export function setAppState(...args) {
  appState.set(...args);
  for (const s of listeners) { s(...args); }
}

export function useAppState(key) {
  const [val, setVal] = useState(appState.get(key));
  useEffect(() => {
    function listener(k, v) {
      if (k === key) { setVal(v); }
    }
    listeners.add(listener);
    return listeners.delete.bind(listeners, listener);
  });
  return val;
}
