import USER_NAMES from './names.js';
import ROCKET_NAMES from './rocket_names.js';
import COLORS from './colors.js';

const MOTORS = 'ABCDEFGHIJKLMNO'.split('');

export function rnd(n) {
  return Array.isArray(n) ? n[rnd(n.length)] : Math.random() * n | 0;
}

export function getMaxId(arr) {
  return arr.reduce((v, o) => parseInt(o.id) > v ? o.id : v, 0);
}

export function createRocket() {
  const name = rnd(ROCKET_NAMES);
  const manufacturer = rnd(['Estes', 'Mad Cow', 'Binder', 'LOC', 'Dynasoar']);
  const mClass = Math.floor(Math.random() ** 2 * MOTORS.length);

  const mRnd = () => (0.2 + 0.8 * Math.random()) * (1 + mClass);

  const mImpulse = 0.3125 * Math.pow(2, mClass + Math.random()); // n-s
  const mBurn = mRnd() / 4;
  const mThrust = mImpulse / mBurn;

  const aspect = 6 + rnd(34); // cm
  const length = mRnd() * 30; // cm
  const diameter = length / aspect;
  const weight = Math.random() * diameter * length; // kg

  const motor = `${MOTORS[mClass]}${Math.round(mThrust)}`;
  const color = rnd(COLORS);

  const rocket = {
    id: Math.random().toString(36).substr(-6),
    name,
    manufacturer,
    diameter: Math.round(diameter),
    length: Math.round(length),
    weight: Math.round(weight),
    motor,
    color
  };

  return rocket;
}
