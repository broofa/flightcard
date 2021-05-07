import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import { useEffect, useState } from 'react';
import { iAttendee, iAttendees, iCard, iLaunch, iLaunchs, iPerm, iPerms, iUser } from './types';

firebase.setLogLevel(process.env.NODE_ENV == 'development' ? 'warn' : 'error');

(window as any).firebase = firebase;

if (!firebase.apps.length) { // Prevents duplicate DBs with HMR'ing
  firebase.initializeApp({
    apiKey: 'AIzaSyARx6u575DX4gjtzhHzT86DJ34s5GHxmRo',
    authDomain: 'flightcard-63595.firebaseapp.com',
    projectId: 'flightcard-63595',
    databaseURL: 'https://flightcard-63595-default-rtdb.firebaseio.com/',
    storageBucket: 'flightcard-63595.appspot.com',
    messagingSenderId: '816049894238',
    appId: '1:816049894238:web:1ff228f2c97ad5ecc215cf',
    measurementId: 'G-HFR5HRJG36'
  });
}

// Value for properties to delete when doing Realtime Database "update"s
export const DELETE = null as unknown as undefined;

export const database = firebase.database;
export const auth = firebase.auth;

//
// Structured database access
//
function createAPI<T>(pathTemplate) {
  type Part = string | undefined;

  interface DataAPI {
    get() : Promise<T>;
    get(a : Part) : Promise<T>;
    get(a : Part, b : Part) : Promise<T>;

    set(state : T) : Promise<T>;
    set(a : Part, state : T) : Promise<T>;
    set(a : Part, b : Part, state : T) : Promise<T>;

    update(state : Partial<T>) : Promise<T>;
    update(a : Part, state : Partial<T>) : Promise<T>;
    update(a : Part, b : Part, state : Partial<T>) : Promise<T>;

    updateChild<S>(a : Part, state : Partial<S>) : Promise<S>;
    updateChild<S>(a : Part, b : Part, state : Partial<S>) : Promise<S>;
    updateChild<S>(a : Part, b : Part, c : Part, state : Partial<S>) : Promise<S>;

    remove() : Promise<any>;
    remove(a : Part) : Promise<any>;
    remove(a : Part, b : Part) : Promise<any>;

    useValue() : T;
    useValue(a : Part) : T;
    useValue(a : Part, b : Part) : T;
  }

  pathTemplate = pathTemplate.split('/');
  const path = pathTemplate.shift();

  function _fullPath(parts : string[], template : string[] = pathTemplate) : string {
    if (parts.length != template.length) throw Error(`Received ${parts.length} parts but expected ${template.length}`);

    pathTemplate.forEach((t, i) => {
      if (typeof parts[i] != 'string') throw Error(`${pathTemplate[i]} (${parts[i]}) is not a string`);
    });

    // Only the last part may be compound
    parts = parts.map((p, i) => i < parts.length - 1 ? p.replace(/\/.*/, '') : p);

    return [path, ...parts].join('/');
  }

  function _ref(parts : string[]) {
    return database().ref(_fullPath(parts));
  }

  function _deletify(state) {
    // Allow for deletion of object properties that are set to undefined
    // (firebase deletes `null` properties from objects, but chokes on undefined)
    if (typeof state == 'object' && state !== null) {
      for (const k in state) if (state[k] === undefined) (state as any)[k] = null;
    }
    return state;
  }

  const api : DataAPI = {
    get(...args : string[]) : Promise<T> {
      console.log(_ref(args));
      return _ref(args).get().then(ref => ref.val());
    },

    set(...parts : (string | T | undefined)[]) {
      const state = parts.pop();
      return _ref(parts as string[]).set(state);
    },

    update(...args : (string | Partial<T> | undefined)[]) : Promise<T> {
      const state = args.pop();
      return _ref(args as string[]).update(_deletify(state));
    },

    updateChild(...args) {
      const state = args.pop();
      return database().ref(_fullPath(args, [...pathTemplate, ':child'])).update(state);
    },

    remove(...args : string[]) : Promise<any> {
      return _ref(args).remove();
    },

    useValue<T>(...args : string[]) {
      const [val, setVal] = useState<T>();

      useEffect(() => {
        // Resolve to undefined if any parts of the path are undefined
        try {
          _fullPath(args);
        } catch {
          return setVal(undefined);
        }

        const ref = _ref(args);
        const onValue = s => setVal(s.val());
        ref.on('value', onValue);
        return () => ref.off('value', onValue);
      }, [...args]);

      return val;
    }
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

  launchCards: createAPI<iCard>('cards/:launchId'),
  launchCard: createAPI<iCard>('cards/:launchId/:cardId')
};
