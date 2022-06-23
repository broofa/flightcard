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

// Adapter for converting values between DB and control types
export type RTAdapter<RTType, ControlType> = {
  toRT: (value: ControlType) => RTType | undefined;
  fromRT: (value: RTType | undefined) => ControlType;
};

//
// Useful RT adapters.  Specifying these here avoids having to memoize them.
//

export const STRING_ADAPTER: RTAdapter<string, string> = {
  fromRT(v) {
    return v ?? '';
  },
  toRT(v) {
    return v.trim();
  },
};

export const BOOL_ADAPTER: RTAdapter<boolean, boolean> = {
  fromRT(v) {
    return !!v;
  },
  toRT(v) {
    return v ? true : DELETE;
  },
};

export type RTState<T> = [T | undefined, boolean, Error | undefined];

export async function rtGet<T>(path: RTPath): Promise<T> {
  return path.isValid()
    ? (await dbGet(dbRef(database, String(path)))).val()
    : undefined;
}

export async function rtSet<T = never>(path: RTPath, value: T) {
  return await dbSet(dbRef(database, String(path)), value);
}

export async function rtRemove(path: RTPath) {
  return await dbRemove(dbRef(database, String(path)));
}

export async function rtUpdate<T = never>(path: RTPath, state: Partial<T>) {
  return await dbUpdate(dbRef(database, String(path)), state);
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
      setError(new Error(path.errorMessage));
      setLoading(false);
      return;
    }

    // Reset loading and error state
    setLoading(true);
    setError(undefined);
    // console.log('SUB', path.toString());

    const unsubscribe = dbOnValue(
      dbRef(database, String(path)),
      s => {
        const dbVal = s.val() as T | undefined;
        if (setter) setter(dbVal);
        setVal(dbVal);
        setLoading(false);
      },
      err => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      // console.log('UNSUB', path.toString());
      unsubscribe();
    };
  }, [path, setter]);

  return [val, loading, error];
}
