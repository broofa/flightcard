export function toss(s: string): never {
  throw new Error(s);
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
