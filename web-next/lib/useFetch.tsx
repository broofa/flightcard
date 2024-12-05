import { wait } from '@flightcard/common';
import { useState } from 'react';

export function useFetch() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<Response | null>(null);

  const fetcher = async (...args: Parameters<typeof fetch>) => {
    setBusy(true);
    try {
      const [response] = await Promise.all([fetch(...args), wait(500)]);
      setResponse(response);
    } catch (err) {
      setError(err as Error);
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, response, fetch: fetcher };
}
