import MOTORS, { Motor } from 'thrustcurve-db';
import { iCard } from '/types';

const motorIndex = new Map<string, Motor>();
const motorNameIndex = new Map<string, Motor>();

export function getMotor(motorId: string) {
  return motorIndex.get(motorId);
}

export function getMotorByDisplayName(name?: string) {
  return motorNameIndex.get(name?.toLowerCase() ?? '');
}

export function motorDisplayName(motor: Motor) {
  const { manufacturerAbbrev, designation, commonName, availability } = motor;
  return (
    manufacturerAbbrev +
    ' ' +
    (designation.indexOf(commonName) >= 0 ? designation : commonName) +
    (availability === 'OOP' ? ' (discontinued)' : '')
  );
}

// Build indexes
for (const motor of MOTORS) {
  motorIndex.set(motor.motorId, motor);
  motorNameIndex.set(motorDisplayName(motor).toLowerCase(), motor);
}

/**
 * Calculate total thrust of all stage-1 motor thrust in Newtons, or NaN if
 * thrust cannot be accurately determined
 */
export function padThrust(cardMotors: iCard['motors']) {
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
