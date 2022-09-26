import { useEffect, useState } from 'react';

export default function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);
  useEffect(() => {
    setIsDebouncing(true);
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);
    return () => {
      clearTimeout(handler);
      setIsDebouncing(false);
    };
  }, [value, delay]);

  return [debouncedValue, isDebouncing] as const;
}
