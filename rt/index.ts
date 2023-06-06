import { initializeApp, setLogLevel } from 'firebase/app';
import 'firebase/auth';
import { getAuth } from 'firebase/auth';
import 'firebase/database';
import {
  get as dbGet,
  getDatabase,
  onValue as dbOnValue,
  ref as dbRef,
  remove as dbRemove,
  set as dbSet,
  update as dbUpdate,
} from 'firebase/database';
import { useEffect, useState } from 'react';
import { RTPath } from './RTPath';
import { errorTrap } from '/components/common/Flash';
import {
  addOfflineDataListener,
  getOfflineData,
  setOfflineData,
} from './offline';

setLogLevel(process.env.NODE_ENV == 'development' ? 'warn' : 'error');

let app = (window as any).app;

// Prevent duplicate DBs with HMR'ing
if (!app) {
  app = (window as any).app = initializeApp({
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

export function rtGet<T>(path: RTPath): Promise<T | undefined> {
  if (process.env.OFFLINE) {
    return new Promise((resolve, reject) => {
      try {
        resolve(getOfflineData(path));
      } catch (err) {
        reject(err);
      }
    });
  }

  if (!path.isValid()) return Promise.resolve(undefined);

  return errorTrap(
    dbGet(dbRef(database, path.toString())).catch(snapshot => snapshot.val())
  );
}

export function rtSet<T = never>(path: RTPath, value: T) {
  if (process.env.OFFLINE) {
    console.log('HERE', path);
    return errorTrap(setOfflineData(path, value));
  }

  return errorTrap(dbSet(dbRef(database, String(path)), value));
}

export function rtRemove(path: RTPath) {
  if (process.env.OFFLINE) {
    return errorTrap(setOfflineData(path, undefined));
  }

  return errorTrap(dbRemove(dbRef(database, path.toString())));
}

export function rtUpdate<T = never>(path: RTPath, state: Partial<T>) {
  if (process.env.OFFLINE) {
    return errorTrap(setOfflineData(path, state));
  }

  return errorTrap(dbUpdate(dbRef(database, path.toString()), state));
}

export function rtTransaction() {
  const updates = new Map<RTPath, unknown>();
  return {
    updates,

    update<T = never>(path: RTPath, state: Partial<T> | undefined) {
      updates.set(path, state);
    },

    async commit() {
      if (process.env.OFFLINE) {
        for (const [path, state] of updates) {
          setOfflineData(path, state);
        }
        return;
      }

      const updateList = [...updates.entries()].map(([path, state]) => [
        path.toString(),
        state,
      ]);

      return errorTrap(dbUpdate(dbRef(database), updateList));
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

    if (process.env.OFFLINE) {
      setVal(getOfflineData(path) as T);
      setLoading(false);

      if (setter) {
        return addOfflineDataListener(path, setter);
      }

      return;
    }

    const unsubscribe = dbOnValue(
      dbRef(database, path.toString()),
      s => {
        const dbVal = s.val() as T | undefined;
        if (setter) setter(dbVal);
        setVal(dbVal ?? undefined);
        setLoading(false);
      },
      err => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [path, setter]);

  return [val, loading, error];
}
