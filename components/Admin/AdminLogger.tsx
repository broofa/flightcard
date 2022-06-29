// eslint-disable-next-line @typescript-eslint/no-explicit-any

import { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let queue: any[] = [];

let onLog = () => {};

export function useLog() {
  const [log, setLog] = useState(queue);
  onLog = () => setLog(queue);

  return log;
}

export function log(...args: any[]) {
  queue = [...queue, args];
  onLog();
}

export function clear() {
  queue = [];
  onLog();
}
