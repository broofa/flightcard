export function toss(s: string): never {
  const err = new Error(s);
  // remove this function from stack
  // err.stack = err.stack
  //   ?.split('\n')
  //   .filter((line) => /\btoss\b/.test(line) === false)
  //   .join('\n');

  throw err;
}
