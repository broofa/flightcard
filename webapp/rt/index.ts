import { type FirebaseApp, initializeApp, setLogLevel } from 'firebase/app';
import 'firebase/auth';
import { getAuth } from 'firebase/auth';
import 'firebase/database';
import {
  get as dbGet,
  onValue as dbOnValue,
  ref as dbRef,
  remove as dbRemove,
  set as dbSet,
  update as dbUpdate,
  getDatabase,
} from 'firebase/database';
import { useEffect, useState } from 'react';
import { errorTrap } from '/components/common/errorTrap';
import type { RTPath } from './RTPath';

declare global {
  interface Window {
    app: FirebaseApp;
  }
}

setLogLevel(process.env.NODE_ENV === 'development' ? 'warn' : 'error');

let app = window.app;

// Prevent duplicate DBs with HMR'ing
if (!app) {
  app = window.app = initializeApp({
    apiKey: 'AIzaSyARx6u575DX4gjtzhHzT86DJ34s5GHxmRo',
    authDomain: 'flightcard-63595.firebaseapp.com',
    projectId: 'flightcard-63595',
    databaseURL: 'https://flightcard-63595-default-rtdb.firebaseio.com/',
    storageBucket: 'flightcard-63595.appspot.com',
    messagingSenderId: '816049894238',
    appId: '1:816049894238:web:1ff228f2c97ad5ecc215cf',
    measurementId: 'G-HFR5HRJG36',
  });
}

// Value for properties to delete when doing Realtime Database updates
export const DELETE = null as unknown as undefined;

export const database = getDatabase(app);
export const auth = getAuth(app);

export type RTState<T> = [T | undefined, boolean, Error | undefined];

export async function rtGet<T>(path: RTPath): Promise<T> {
  if (!path.isValid()) {
    return undefined as unknown as T;
  }

  return (await errorTrap(dbGet(dbRef(database, String(path))))).val();
}

export function rtSet<T = never>(path: RTPath, value: T) {
  return errorTrap(dbSet(dbRef(database, String(path)), value));
}

export function rtRemove(path: RTPath) {
  return errorTrap(dbRemove(dbRef(database, String(path))));
}

export function rtUpdate<T = never>(path: RTPath, state: Partial<T>) {
  return errorTrap(dbUpdate(dbRef(database, String(path)), state));
}

export function rtTransaction() {
  const updates: { [key: string]: unknown } = {};
  return {
    updates,

    update<T = never>(path: RTPath, state: Partial<T> | undefined) {
      updates[path.toString()] = state;
    },

    async commit() {
      return errorTrap(dbUpdate(dbRef(database), updates));
    },
  };
}

export function useRTValue<T = never>(
  path: RTPath,
  setter?: (val?: T) => void
): RTState<T> {
  const [val, setVal] = useState<T | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    // Silently ignore attempts to use invalid paths.
    if (!path.isValid()) {
      setLoading(false);
      setError(new Error(path.errorMessage));
      return;
    }

    // Reset loading and error state
    setLoading(true);
    setError(undefined);

    const unsubscribe = dbOnValue(
      dbRef(database, String(path)),
      (s) => {
        const dbVal = s.val() as T | undefined;
        if (setter) setter(dbVal);
        setVal(dbVal ?? undefined);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [path, setter]);

  return [val, loading, error];
}
