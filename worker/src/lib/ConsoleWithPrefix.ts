class ConsoleWithPrefix {
  #prefix: string;

  constructor(private prefix: string) {
    this.#prefix = prefix + ':';
  }

  log(...args: unknown[]) {
    console.log(this.#prefix, ...args);
  }

  warn(...args: unknown[]) {
    console.warn(this.#prefix, ...args);
  }

  error(...args: unknown[]) {
    console.error(this.#prefix, ...args);
  }

  time(label: string) {
    console.time(this.#prefix + ' ' + label);
  }

  timeEnd(label: string) {
    console.timeEnd(this.#prefix + ' ' + label);
  }
}

export default ConsoleWithPrefix;
