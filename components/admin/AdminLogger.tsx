// eslint-disable-next-line @typescript-eslint/no-explicit-any

import { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queue: any[] = [];

let onLog = () => {};

export function useLog() {
  const [log, setLog] = useState(queue);
  const [, setLength] = useState(queue.length);
  onLog = () => {
    setLog(queue);
    setLength(queue.length);
  };
  return log;
}

export function log(...args: any[]) {
  queue.push(args);
  onLog();
}

export function clear() {
  queue.length = 0;
  onLog();
}
