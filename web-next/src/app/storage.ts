import { useState } from 'react';

export function useStorage(key: string) {
  if (typeof localStorage === 'undefined') {
    return [null, () => {}] as const;
  }

  const [val, setVal] = useState(localStorage.getItem(key));
  const setValue = (value?: string) => {
    if (value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  };

  return [val, setValue] as const;
}
