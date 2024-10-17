import MOTORS, { TCMotor } from 'thrustcurve-db';
import { iCard, iMotor } from '/types';

// Init motor impulse class information structure
let _impulse: number;
export const IMPULSE_CLASSES = [
  { name: '\u{215b}A', min: 0, max: (_impulse = 0.3125) }, // 1/8A
  { name: '\u{215c}A', min: _impulse, max: (_impulse *= 2) }, // 1/4A
  { name: '\u{215d}A', min: _impulse, max: (_impulse *= 2) }, // 1/2A
  { name: 'A', min: _impulse, max: (_impulse *= 2) },
  { name: 'B', min: _impulse, max: (_impulse *= 2) },
  { name: 'C', min: _impulse, max: (_impulse *= 2) },
  { name: 'D', min: _impulse, max: (_impulse *= 2) },
  { name: 'E', min: _impulse, max: (_impulse *= 2) },
  { name: 'F', min: _impulse, max: (_impulse *= 2) },
  { name: 'G', min: _impulse, max: (_impulse *= 2) },
  { name: 'H', min: _impulse, max: (_impulse *= 2) },
  { name: 'I', min: _impulse, max: (_impulse *= 2) },
  { name: 'J', min: _impulse, max: (_impulse *= 2) },
  { name: 'K', min: _impulse, max: (_impulse *= 2) },
  { name: 'L', min: _impulse, max: (_impulse *= 2) },
  { name: 'M', min: _impulse, max: (_impulse *= 2) },
  { name: 'N', min: _impulse, max: (_impulse *= 2) },
  { name: 'O', min: _impulse, max: (_impulse *= 2) },
  { name: 'P', min: _impulse, max: (_impulse *= 2) },
  { name: 'Q', min: _impulse, max: (_impulse *= 2) },
  { name: 'R', min: _impulse, max: (_impulse *= 2) },
  { name: 'S', min: _impulse, max: (_impulse *= 2) },
  { name: 'T', min: _impulse, max: (_impulse *= 2) },
  { name: 'U', min: _impulse, max: (_impulse *= 2) },
  { name: 'V', min: _impulse, max: (_impulse *= 2) },
  { name: 'W', min: _impulse, max: (_impulse *= 2) },
  { name: 'X', min: _impulse, max: (_impulse *= 2) },
  { name: 'Y', min: _impulse, max: (_impulse *= 2) },
  { name: 'Z', min: _impulse, max: (_impulse *= 2) },
  { name: 'AA', min: _impulse, max: (_impulse *= 2) },
  { name: 'AB', min: _impulse, max: (_impulse *= 2) },
  { name: 'AC', min: _impulse, max: (_impulse *= 2) },
  { name: 'AD', min: _impulse, max: (_impulse *= 2) },
  { name: 'AE', min: _impulse, max: (_impulse *= 2) },
  { name: 'AF', min: _impulse, max: (_impulse *= 2) },
  { name: 'AG', min: _impulse, max: (_impulse *= 2) },
  { name: 'AH', min: _impulse, max: (_impulse *= 2) },
  { name: 'AI', min: _impulse, max: (_impulse *= 2) },
  { name: 'AJ', min: _impulse, max: (_impulse *= 2) },
];

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
  return MOTORS.map((motor) => {
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

  const motors = Object.values(cardMotors).filter((m) => (m.stage ?? 1) === 1);

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
  for (const { name, min, max } of IMPULSE_CLASSES) {
    // Note: Using min(exclusive), max(inclusive) here, as that's how NFPA 1125
    // interprets impulse range limits
    if (impulse > min && impulse <= max) return name;
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
