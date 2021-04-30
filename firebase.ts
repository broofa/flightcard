import { iUser, iLaunch, iLaunchUser, iCard, iPad, iLaunchs, iPads, iLaunchUsers, iPerm, iPerms } from './types';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';

import { useState, useEffect } from 'react';

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

(window as any).firebase = firebase;

export const database = firebase.database;
export const auth = firebase.auth;

//
// Structured database access
//

function _key(...parts : string[]) {
  parts = [...parts];
  if (parts.some(v => !v)) return undefined;
  return parts.map(p => p.replace(/\/.*/, '')).join('/');
}

function _ref(...parts : string[]) {
  return database().ref(_key(...parts));
}

function set<T>(...args) {
  args = [...args];
  const state : T = args.pop();
  return _ref(...args).set(state);
}

function update<T>(...args) {
  args = [...args];
  const state : T = args.pop();
  for (const k in state) if (state[k] === undefined) (state as any)[k] = null;
  return _ref(...args).update(state);
}

function remove(path, ...args) {
  return _ref(...args).remove();
}

function useValue<T>(...args) {
  const key = _key(...args);

  const [val, setVal] = useState<T>();

  useEffect(() => {
    if (key === undefined) return setVal(undefined);

    const ref = _ref(...args);
    const onValue = s => setVal(s.val());
    ref.on('value', onValue);
    return () => ref.off('value', onValue);
  }, [...args]);

  return val;
}

// Factory function(s) for generating APIs on to data at different depths of the
// db. (I don't know how to maintain strict typechecking with variable-length
// argument lists here, so just hard-coding for now)

function dataDepth0<T>(path) {
  return {
    set(state : T) { return set(path, state); },
    update(state : Partial<T>) { return update(path, state); },
    remove() { return remove(path); },
    useValue() { return useValue<T>(path); }
  };
}

function dataDepth1<T>(path) {
  return {
    set(a : string, state : T) { return set<T>(path, a, state); },
    update(a : string, state : Partial<T>) { return update<T>(path, a, state); },
    remove(a : string) { return remove(path, a); },
    useValue(a : string | undefined) { return useValue<T>(path, a); }
  };
}

function dataDepth2<T>(path) {
  return {
    set<T>(a : string, b : string, state : T) { return set<T>(path, a, b, state); },
    update(a : string, b : string, state : Partial<T>) { return update<T>(path, a, b, state); },
    remove(a : string, b : string) { return remove(path, a, b); },
    useValue(a : string | undefined, b : string | undefined) { return useValue<T>(path, a, b); }
  };
}

export const db = {
  // (Note: everything after 1st slash in the paths here is discarded, but we
  // provide the whole path for documentation purposes)
  user: dataDepth1<iUser>('users/:userId'),

  launches: dataDepth0<iLaunchs>('launches'),
  launch: dataDepth1<iLaunch>('launches/:userId'),

  launchPerms: dataDepth1<iPerms>('launchPerms/:launchId'),
  launchPerm: dataDepth2<iPerm>('launchPerms/:launchId/:userId'),

  launchUsers: dataDepth1<iLaunchUsers>('launchUsers/:launchId'),
  launchUser: dataDepth2<iLaunchUser>('launchUsers/:launchId/:userId'),

  pads: dataDepth2<iPads>('pads/:launchId/:userId'),
  pad: dataDepth1<iPad>('launches/:launchId'),

  cards: dataDepth2<iCard>('cards/:launchId/:cardId')
};
