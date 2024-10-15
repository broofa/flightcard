
import { useState } from 'react';

let queue: unknown[][] = [];

let onLog = () => {};

export function useLog() {
  const [log, setLog] = useState(queue);
  onLog = () => setLog(queue);

  return log;
}

export function log(...args: unknown[]) {
  queue = [...queue, args];
  onLog();
}

export function clear() {
  queue = [];
  onLog();
}
