import { initializeApp, setLogLevel } from 'firebase/app';
import 'firebase/auth';
import { getAuth } from 'firebase/auth';
import 'firebase/database';
import {
  get as dbGet,
  getDatabase,
  onValue as dbOnValue,
  query as dbQuery,
  ref as dbRef,
  remove as dbRemove,
  set as dbSet,
  update as dbUpdate,
} from 'firebase/database';
import { useEffect, useState } from 'react';
import { RTPath } from './RTPath';
import { errorTrap } from '/components/common/ErrorFlash';
import {
  iAttendee,
  iAttendees,
  iCard,
  iCards,
  iLaunch,
  iLaunchs,
  iPad,
  iPads,
  iPerm,
  iPerms,
  iUser,
} from '/types';

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

export const util = {
  async get<T>(path: RTPath): Promise<T> {
    return path.isValid()
      ? (await dbGet(dbRef(database, String(path)))).val()
      : undefined;
  },

  async set(path: RTPath, value: unknown) {
    return await dbSet(dbRef(database, String(path)), value);
  },

  async remove(path: RTPath) {
    return await dbRemove(dbRef(database, String(path)));
  },

  async update(path: RTPath, state: object) {
    return await dbUpdate(dbRef(database, String(path)), state);
  },

  useValue<T>(path: RTPath, setter?: (val?: T) => void): RTState<T> {
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
  },
};

//
// Structured database access
//
function createAPI<T>(pathTemplate: string) {
  type Part = string | undefined;

  const templateParts = pathTemplate.split('/');
  const path = templateParts.shift();

  function _fullPath(
    parts: string[],
    template: string[] = templateParts
  ): string {
    if (parts.length != template.length)
      throw Error(
        `Received ${parts.length} parts but expected ${template.length}`
      );

    templateParts.forEach((t, i) => {
      if (typeof parts[i] != 'string')
        throw Error(`${templateParts[i]} (${parts[i]}) is not a string`);
    });

    // Only the last part may be compound
    parts = parts.map((p, i) =>
      i < parts.length - 1 ? p.replace(/\/.*/, '') : p
    );

    return [path, ...parts].join('/');
  }

  function _ref(parts: string[]) {
    return dbRef(database, _fullPath(parts));
  }

  function _deletify<T>(state: T): T {
    // Allow for deletion of object properties that are set to undefined
    // (firebase deletes `null` properties from objects, but chokes on undefined)
    if (typeof state == 'object' && state !== null) {
      for (const k in state)
        if (state[k] === undefined) (state as any)[k] = null;
    }
    return state;
  }
  interface DataAPI {
    get(): Promise<T>;
    get(a: Part): Promise<T>;
    get(a: Part, b: Part): Promise<T>;

    set(state: T | undefined): Promise<T>;
    set(a: Part, state: T | undefined): Promise<T>;
    set(a: Part, b: Part, state: T | undefined): Promise<T>;

    update(state: Partial<T>): Promise<void>;
    update(a: Part, state: Partial<T>): Promise<void>;
    update(a: Part, b: Part, state: Partial<T>): Promise<void>;

    updateChild<S>(a: Part, state: Partial<S>): Promise<S>;
    updateChild<S>(a: Part, b: Part, state: Partial<S>): Promise<S>;
    updateChild<S>(a: Part, b: Part, c: Part, state: Partial<S>): Promise<S>;

    remove(): Promise<void>;
    remove(a: Part): Promise<void>;
    remove(a: Part, b: Part): Promise<void>;

    useValue(): T;
    useValue(a: Part): T;
    useValue(a: Part, b: Part): T;
  }

  const api: DataAPI = {
    async get(...args: string[]): Promise<T> {
      const result = await dbGet(dbQuery(_ref(args)));
      return errorTrap(result.val());
    },

    async set(...parts: unknown[]) {
      const state = parts.pop() as T;
      const ref = _ref(parts as string[]);
      errorTrap(dbSet(ref, state));
      return state;
    },

    update(...args: unknown[]) {
      const state = args.pop() as Partial<T>;
      const ref = _ref(args as string[]);
      return errorTrap(dbUpdate(ref, _deletify(state)));
    },

    updateChild(...args: unknown[]) {
      const state = args.pop() as object;
      const ref = dbRef(
        database,
        _fullPath(args as string[], [...templateParts, ':child'])
      );
      return errorTrap(dbUpdate(ref, state));
    },

    remove(...args: string[]) {
      return errorTrap(dbRemove(_ref(args)));
    },

    useValue<T>(...args: string[]) {
      const [val, setVal] = useState<T>();

      useEffect(() => {
        // Resolve to undefined if any parts of the path are undefined
        try {
          _fullPath(args);
        } catch {
          return setVal(undefined);
        }

        return dbOnValue(_ref(args), s => setVal(s.val()));
      }, [...args]);

      return val;
    },
  };

  return api;
}

export const db = {
  // (Note: everything after 1st slash in the paths here is discarded, but we
  // provide the whole path for documentation purposes)
  user: createAPI<iUser>('users/:userId'),

  launches: createAPI<iLaunchs>('launches'),
  launch: createAPI<iLaunch>('launches/:userId'),

  officers: createAPI<iPerms>('officers/:launchId'),
  officer: createAPI<iPerm>('officers/:launchId/:userId'),

  attendees: createAPI<iAttendees>('attendees/:launchId'),
  attendee: createAPI<iAttendee>('attendees/:launchId/:userId'),

  cards: createAPI<iCards>('cards/:launchId'),
  card: createAPI<iCard>('cards/:launchId/:cardId'),

  pads: createAPI<iPads>('pads/:launchId'),
  pad: createAPI<iPad>('pads/:launchId/:padId'),
};
