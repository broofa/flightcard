class ConsoleLogger {
  constructor(private prefix: string) {}
  log(...args: unknown[]) {
    console.log(this.prefix, ...args);
  }

  warn(...args: unknown[]) {
    console.warn(this.prefix, ...args);
  }

  error(...args: unknown[]) {
    console.error(this.prefix, ...args);
  }
}

export default ConsoleLogger;
