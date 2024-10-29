export default function ConsoleLogger(prefix: string) {
  return {
    log(...args: unknown[]) {
      console.log(prefix, ...args);
    },

    warn(...args: unknown[]) {
      console.warn(prefix, ...args);
    },

    error(...args: unknown[]) {
      console.error(prefix, ...args);
    },
  };
}
