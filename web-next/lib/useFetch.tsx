import { type DependencyList, useEffect, useState } from 'react';

function cachedFetch(input: string, init?: RequestInit) {
  const method = init?.method ?? 'GET';
  const key = `${method} ${input}`;
  return fetch(input, init).then((res) => {
    if (!res.ok) {
      throw new Error(`Fetch failed, code=${res.status}`);
    }

    return res.json();
  });
}

export function useFetch<T extends DependencyList, U = unknown>(
  fetcher: (deps: T) => Promise<U>,
  deps: T
) {
  const [data, setData] = useState<U>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(false);

  async function run() {
    setIsLoading(true);
    try {
      const data = await fetcher(deps);
      setData(data);
      setError(undefined);
    } catch (err) {
      setData(undefined);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    run();
  }, deps);

  return { run, data, error, isLoading };
}
