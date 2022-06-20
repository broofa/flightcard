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

  useSimpleValue<T>(path: RTPath, setter?: (val?: T) => void): T | undefined {
    const [val] = this.useValue(path, setter);
    return val;
  },

  useValue<T>(path: RTPath, setter?: (val?: T) => void): RTState<T> {
    const [val, setVal] = useState<T | undefined>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error>();

    useEffect(() => {
      // Silently ignore attempts to use invalid paths.
      if (!path.isValid()) {
        setError(new Error(path.errorMessage));
        return;
      }

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
      return unsubscribe;
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

/**
 * Typed realtime path support.  RTPath instances are immutable, and consist of
 * a path template like "/users/:launchId/:userId" and an optional field tokens
 * object (e.g. {launchId: '123', userId: '456'}) to use when rendering the path
 * to a string.
 *
 * RTPaths due double duty as both path templates, and as path strings.  Because
 * of this, they are allowed to exist in "invalid" states where an instance may
 * not have the fields needed to wholly render a path.   In this case,
 * attempting to convert the path to a string will throw an error!  Callers are
 * expected to validate any path prior to using it.  To that end, paths support
 * validate() and isValid() methods.
 */
export class RTPath<Fields = Record<string, string>> {
  private _memo: string | undefined;
  private _error: string | undefined;
  private _cache = new Map<string, RTPath<Fields>>();

  constructor(
    private readonly template: string,
    private readonly fields?: Fields
  ) {}

  private render() {
    if (this._memo) return;
    const missing = [];
    this._memo = this.template.replace(/:\w+/g, match => {
      const token = match.substring(1);
      const val = (this.fields as unknown as Record<string, string>)?.[token];
      if (!val) {
        missing.push(token);
      }
      return val || '<missing>';
    });
  }

  with(fields?: Fields) {
    // ad-hoc memoization logic (avoids looping in React).  This isn't perfect,
    // but it's good enough for now.
    const key = JSON.stringify(fields ?? null);
    let path: RTPath<Fields> | undefined = this._cache.get(key);
    if (!path) {
      path = new RTPath(this.template, fields);
      this._cache.set(key, path);
    }

    return path;
  }

  append<T>(subpath: string) {
    return new RTPath<Fields & T>(this.template + '/' + subpath);
  }

  isValid() {
    this.render();
    return !this._error;
  }

  get errorMessage() {
    this.render();
    return this._error;
  }

  toString() {
    this.render();
    if (this._error) throw Error(this._error);
    return this._memo;
  }
}

type UserField = { userId: string };
type LaunchField = { launchId: string };
type CardField = { cardId: string };
type MotorField = { motorId: string };
export type AuthFields = { authId: string };
export type CardFields = LaunchField & CardField;
export type MotorFields = CardFields & MotorField;
export type AttendeeFields = LaunchField & UserField;

export const USER_PATH = new RTPath<AuthFields>('/users/:authId');

export const ATTENDEES_PATH = new RTPath<LaunchField>('/attendees/:launchId/');
export const ATTENDEE_PATH = ATTENDEES_PATH.append<AttendeeFields>(':userId');

export const OFFICERS_PATH = new RTPath<LaunchField>('/officers/:launchId');
export const PADS_PATH = new RTPath<LaunchField>('/pads/:launchId');

export const LAUNCHES_PATH = new RTPath('/launches');
export const LAUNCH_PATH = LAUNCHES_PATH.append<LaunchField>(':launchId');

export const CARDS_PATH = new RTPath<LaunchField>('/cards/:launchId');
export const CARD_PATH = CARDS_PATH.append<CardField>(':cardId');
export const CARD_MOTORS_PATH = CARD_PATH.append('motors');
export const CARD_MOTOR_PATH = CARD_MOTORS_PATH.append<MotorField>(':motorId');
export const CARD_ROCKET_PATH = CARD_PATH.append('rocket');
