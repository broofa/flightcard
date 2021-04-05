import ROCKET_NAMES from './rocket_names';
import COLORS from './colors';
import { iRocket } from '../db';

const MOTORS = 'ABCDEFGHIJKLMNO'.split('');

export function rnd(n : number) : number {
  return Math.floor(Math.random() * n) as number;
}

export function rndItem<Type>(arr : Type[]) : Type {
  return arr[rnd(arr.length)];
}

export function createRocket() : iRocket {
  const name = rndItem(ROCKET_NAMES);
  const manufacturer = rndItem(['Estes', 'Mad Cow', 'Binder', 'LOC', 'Dynasoar']);
  const mClass = Math.floor(Math.random() ** 2 * MOTORS.length);

  const mRnd = () => (0.2 + 0.8 * Math.random()) * (1 + mClass);

  const _mImpulse = 0.3125 * Math.pow(2, mClass + Math.random()); // n-s
  const _mBurn = mRnd() / 4;
  const _mThrust = _mImpulse / _mBurn;

  const aspect = 6 + rnd(34); // cm
  const length = mRnd() * 30; // cm
  const diameter = length / aspect;
  const weight = Math.random() * diameter * length; // kg

  const motor = `${MOTORS[mClass]}${Math.round(_mThrust)}`;
  const color = rndItem(COLORS);

  const rocket = {
    id: 1e7 + Math.floor(1e6 * Math.random()),
    name,
    manufacturer,
    color,
    diameter: Math.round(diameter),
    length: Math.round(length),
    weight: Math.round(weight),
    motor,
    _mImpulse,
    _mBurn,
    _mThrust
  };

  return rocket;
}
