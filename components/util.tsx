import { iUser } from '../types';
import React, { useRef, useEffect } from 'react';
import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';

const db = {};

export function Loading({ wat, ...props }) {
  return <div {...props}>Loading {}</div>;
}

export function usePrevious<T>(value : T) {
  const ref = useRef<T>();
  useEffect(() => { ref.current = value; });
  return ref.current as T;
}
