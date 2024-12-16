import { useEffect, useState } from 'react';

export function useDebounce<T>(val: T, delay: number) {
  const [debounced, setDebounced] = useState(val);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(val), delay);
    return () => clearTimeout(timer);
  }, [val]);

  return debounced;
}
