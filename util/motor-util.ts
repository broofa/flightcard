import MOTORS, { TCMotor } from 'thrustcurve-db';
import { iCard, iMotor } from '/types';

type ImpulseRange = {
  min: number;
  max: number;
};

let _maxi: number;
export const IMPULSE_CLASSES = new Map<string, ImpulseRange>([
  ['\u{215b}A', { min: (_maxi = 0), max: (_maxi = 0.3125) }], // 1/8A
  ['\u{00bc}A', { min: _maxi, max: (_maxi *= 2) }], // 1/4A
  ['\u{00bd}A', { min: _maxi, max: (_maxi *= 2) }], // 1/2A
  ['A', { min: _maxi, max: (_maxi *= 2) }],
  ['B', { min: _maxi, max: (_maxi *= 2) }],
  ['C', { min: _maxi, max: (_maxi *= 2) }],
  ['D', { min: _maxi, max: (_maxi *= 2) }],
  ['E', { min: _maxi, max: (_maxi *= 2) }],
  ['F', { min: _maxi, max: (_maxi *= 2) }],
  ['G', { min: _maxi, max: (_maxi *= 2) }],
  ['H', { min: _maxi, max: (_maxi *= 2) }],
  ['I', { min: _maxi, max: (_maxi *= 2) }],
  ['J', { min: _maxi, max: (_maxi *= 2) }],
  ['K', { min: _maxi, max: (_maxi *= 2) }],
  ['L', { min: _maxi, max: (_maxi *= 2) }],
  ['M', { min: _maxi, max: (_maxi *= 2) }],
  ['N', { min: _maxi, max: (_maxi *= 2) }],
  ['O', { min: _maxi, max: (_maxi *= 2) }],
  ['P', { min: _maxi, max: (_maxi *= 2) }],
  ['Q', { min: _maxi, max: (_maxi *= 2) }],
  ['R', { min: _maxi, max: (_maxi *= 2) }],
  ['S', { min: _maxi, max: (_maxi *= 2) }],
  ['T', { min: _maxi, max: (_maxi *= 2) }],
  ['U', { min: _maxi, max: (_maxi *= 2) }],
  ['V', { min: _maxi, max: (_maxi *= 2) }],
  ['W', { min: _maxi, max: (_maxi *= 2) }],
  ['X', { min: _maxi, max: (_maxi *= 2) }],
  ['Y', { min: _maxi, max: (_maxi *= 2) }],
  ['Z', { min: _maxi, max: (_maxi *= 2) }],
  ['AA', { min: _maxi, max: (_maxi *= 2) }],
  ['AB', { min: _maxi, max: (_maxi *= 2) }],
  ['AC', { min: _maxi, max: (_maxi *= 2) }],
  ['AD', { min: _maxi, max: (_maxi *= 2) }],
  ['AE', { min: _maxi, max: (_maxi *= 2) }],
  ['AF', { min: _maxi, max: (_maxi *= 2) }],
  ['AG', { min: _maxi, max: (_maxi *= 2) }],
  ['AH', { min: _maxi, max: (_maxi *= 2) }],
  ['AI', { min: _maxi, max: (_maxi *= 2) }],
  ['AJ', { min: _maxi, max: (_maxi *= 2) }],
]);

Object.freeze(IMPULSE_CLASSES);

const motorIndex = new Map<string, TCMotor>();
const motorNameIndex = new Map<string, TCMotor>();

// We don't want this being modified
Object.freeze(MOTORS);

// Build indexes
for (const motor of MOTORS) {
  // ... or this
  Object.freeze(motor);

  motorIndex.set(motor.motorId, motor);
  motorNameIndex.set(motorDisplayName(motor).toLowerCase(), motor);
}

export function getMotor(motorId: string) {
  return motorIndex.get(motorId);
}

export function getMotorByDisplayName(name?: string) {
  return motorNameIndex.get(name?.toLowerCase() ?? '');
}

/**
 * Find motors that "match" the query string.  I'm sure this can be optimized,
 * but it's good enough for now.
 */
export function motorSearch(q: string) {
  if (!q) return [];

  const terms = q.trim().toLowerCase().split(/\s+/);
  return MOTORS.map(motor => {
    let score = 0;
    let {
      impulseClass = '',
      designation = '',
      commonName = '',
      manufacturerAbbrev = '',
      propInfo = '',
    } = motor;
    const { sparky, availability } = motor;

    impulseClass = impulseClass.toLowerCase() as typeof impulseClass;
    designation = designation.toLowerCase();
    commonName = commonName.toLowerCase();
    propInfo = propInfo.toLowerCase();

    manufacturerAbbrev = manufacturerAbbrev.toLowerCase();

    for (const term of terms) {
      let termScore = 0;

      if (term === impulseClass) {
        termScore += 1;
      }

      if (commonName.startsWith(term)) {
        termScore += 1;
      }

      if (designation.includes(term)) {
        termScore += 0.5;
      }

      if (manufacturerAbbrev.includes(term)) {
        termScore += 0.25;
      }

      if (propInfo.includes(term)) {
        termScore += 0.5;
      }

      if (sparky && 'sparky'.startsWith(term)) {
        termScore += 0.1;
      }

      if (termScore <= 0) {
        score = 0;
        break;
      }

      score += termScore;
    }

    if (availability === 'OOP') {
      score /= 10;
    }

    return { motor, score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ motor }) => motor);
}

export function motorDisplayName(motor: TCMotor) {
  const { manufacturerAbbrev, designation, commonName, availability } = motor;
  return (
    manufacturerAbbrev +
    ' ' +
    (designation.indexOf(commonName) >= 0 ? designation : commonName) +
    (availability === 'OOP' ? ' (discontinued)' : '')
  );
}

/**
 * Calculate total thrust of all stage-1 motor thrust in Newtons, or NaN if
 * thrust cannot be accurately determined
 */
export function stage1Thrust(cardMotors: iCard['motors']) {
  if (!cardMotors) return NaN;

  const motors = Object.values(cardMotors).filter(m => (m.stage ?? 1) === 1);

  if (!motors?.length) return NaN;

  return motors.reduce((acc, motor) => {
    let thrust: number;
    if (motor.tcMotorId) {
      // Use thrust from thrustcurve data if available
      thrust = getMotor(motor.tcMotorId)?.avgThrustN ?? NaN;
    } else if (motor.name) {
      // Scrape from motor name
      const match = motor.name.match(/[a-z]([\d.]+)/i)?.[1];
      thrust = match ? parseInt(match) : NaN;
    } else {
      // No thrust data available
      thrust = NaN;
    }

    return acc + thrust;
  }, 0);
}

export function motorClassForImpulse(impulse: number | undefined) {
  if (impulse === undefined) return undefined;

  if (isNaN(impulse)) return undefined;
  for (const [k, { min, max }] of IMPULSE_CLASSES) {
    if (impulse >= min && impulse < max) return k;
  }
}

export function totalImpulseClass(motors?: iMotor[]) {
  if (!motors) return undefined;
  const impulse = Object.entries(motors).reduce(
    (acc: number, [, m]) => acc + (m.impulse ?? NaN),
    0
  );

  return motorClassForImpulse(impulse);
}
