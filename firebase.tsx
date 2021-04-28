import { iUser, iLaunch, iLaunchUser, iCard, iPad } from './types';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';

import { useState, useEffect } from 'react';

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

(window as any).firebase = firebase;

export const database = firebase.database;
export const auth = firebase.auth;

function _dtResource<T>(resource : string) {
  function _ref(key) {
    return database().ref(key ? `${resource}/${key}` : resource);
  }

  return {
    push(key : string, state : T) {
      return _ref(key).push(state).then(ref => ref.key);
    },

    set<TT>(key : string, state : TT | undefined) {
      if (state == undefined) return _ref(key).remove();

      _ref(key).set(state);
    },

    useValue<TT = T>(key : string) : TT | undefined {
      const [val, setVal] = useState<TT>();
      const ref = _ref(key);

      useEffect(() => {
        if (key === undefined) return setVal(undefined);

        const onValue = s => setVal(s.val());
        ref.on('value', onValue);
        return () => ref.off('value', onValue);
      }, [key]);

      return val;
    }
  };
}

export const db = {
  users: _dtResource<iUser>('users'),
  launches: _dtResource<iLaunch>('launches'),
  launchUsers: _dtResource<iLaunchUser>('launchUsers'),
  cards: _dtResource<iCard>('cards'),
  pads: _dtResource<iPad>('pads')
};
