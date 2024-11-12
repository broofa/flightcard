import type { TCMotor } from 'thrustcurve-db';
import type { iCard, iMotor } from '/types';

const MOTORS: TCMotor[] = [];

// Init motor impulse class information structure
let _impulse: number;
export const IMPULSE_CLASSES = [
  '\u{215b}A', // 1/8A
  '\u{215c}A', // 1/4A
  '\u{215d}A', // 1/2A
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  'AA',
  'AB',
  'AC',
  'AD',
  'AE',
  'AF',
  'AG',
  'AH',
  'AI',
  'AJ',
].map((name, i) => {
  return {
    name,
    min: i === 0 ? 0 : 0.3125 * 2 ** (i - 1),
    max: 0.3125 * 2 ** i,
  };
});

let motorFetch: Promise<MotorDB> | null = null;

export function loadMotorDB() {
  console.trace('Loading motor database');
  if (!motorFetch) {
    motorFetch = new Promise((resolve, reject) => {
      import('thrustcurve-db')
        .then((m) => {
          const motors = m.default;

          // Freeze motor data
          for (const motor of motors) {
            Object.freeze(motor);
          }

          resolve(new MotorDB(motors));
        })
        .catch(reject);
    });
  }

  return motorFetch;
}

export class MotorDB {
  #motorIndex = new Map<string, TCMotor>();
  #motorNameIndex = new Map<string, TCMotor>();
  #motors: readonly Readonly<TCMotor>[];

  constructor(motors: TCMotor[]) {
    this.#motors = motors;
    this.#init();
  }

  #init() {
    for (const motor of this.#motors) {
      this.#motorIndex.set(motor.motorId, motor);
      this.#motorNameIndex.set(motorDisplayName(motor).toLowerCase(), motor);
    }
  }

  get motors() {
    return this.#motors;
  }

  getMotor(motorId: string) {
    return this.#motorIndex.get(motorId);
  }

  getMotorByDisplayName(name?: string) {
    return this.#motorNameIndex.get(name?.toLowerCase() ?? '');
  }

  /**
   * Find motors that "match" the query string.  I'm sure this can be optimized,
   * but it's good enough for now.
   */
  motorSearch(q: string) {
    if (!q) return [];

    const terms = q.trim().toLowerCase().split(/\s+/);
    return this.#motors
      .map((motor) => {
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

  /**
   * Calculate total thrust of all stage-1 motor thrust in Newtons, or NaN if
   * thrust cannot be accurately determined
   */
  stage1Thrust(cardMotors: iCard['motors']) {
    if (!cardMotors) return Number.NaN;

    const motors = Object.values(cardMotors).filter(
      (m) => (m.stage ?? 1) === 1
    );

    if (!motors?.length) return Number.NaN;

    return motors.reduce((acc, motor) => {
      let thrust: number;
      if (motor.tcMotorId) {
        // Use thrust from thrustcurve data if available
        thrust = this.getMotor(motor.tcMotorId)?.avgThrustN ?? Number.NaN;
      } else if (motor.name) {
        // Scrape from motor name
        const match = motor.name.match(/[a-z]([\d.]+)/i)?.[1];
        thrust = match ? Number.parseInt(match) : Number.NaN;
      } else {
        // No thrust data available
        thrust = Number.NaN;
      }

      return acc + thrust;
    }, 0);
  }
}

export function motorClassForImpulse(impulse: number | undefined) {
  if (impulse === undefined) return undefined;

  if (Number.isNaN(impulse)) return undefined;
  for (const { name, min, max } of IMPULSE_CLASSES) {
    // Note: Using min(exclusive), max(inclusive) here, as that's how NFPA 1125
    // interprets impulse range limits
    if (impulse > min && impulse <= max) return name;
  }
}

export function totalImpulseClass(motors?: iMotor[]) {
  if (!motors) return undefined;
  const impulse = Object.entries(motors).reduce(
    (acc: number, [, m]) => acc + (m.impulse ?? Number.NaN),
    0
  );

  return motorClassForImpulse(impulse);
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
