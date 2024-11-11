export class HTTPResponseError extends Error {
  constructor(
    readonly message: string,
    readonly response: Response
  ) {
    super();
  }
}

/**
 * Hook for issuing a fetch request.  (Candidate for `utils`?)
 *
 * @param {string | URL} url
 * @param {Object} options  Options object passed to fetch(), with the addition of the following additional properties:
 * @param {function} [options.onData] Callback to invoke when data is received
 * @param {function} [options.onError] Callback to invoke when an error occurs
 * @returns [function, boolean] A function to invoke the fetch, and a boolean indicating whether the fetch is in progress
 */
export function fetchHelper<ResponseType>(
  url: string | URL,
  {
    setData,
    setError,
    setLoading,
    ...options
  }: RequestInit & {
    setData?: (data: ResponseType) => void;
    setError?: (err: Error | undefined) => void;
    setLoading?: (loading: boolean) => void;
  }
) {
  const controller = new AbortController();

  setLoading?.(!!url);
  setError?.(undefined);

  if (url) {
    fetch(url, { ...options, signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new HTTPResponseError(res.statusText, res);
        }
        return res.json();
      })
      .then((json) => setData?.(json))
      .catch((err) => {
        setError?.(err as Error);
      })
      .finally(() => setLoading?.(false));
  }

  return () => {
    controller.abort();
    setLoading?.(false);
    setError?.(undefined);
  };
}
