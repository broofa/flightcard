import MOTORS, { Motor } from 'thrustcurve-db';
import { iCard } from '../types';
import { MKS, unitParse } from './units';

const motorIndex = new Map<string, Motor>();
const motorNameIndex = new Map<string, Motor>();

export function getMotor(motorId : string | undefined) {
  if (motorId) return motorIndex.get(motorId);
}

export function getMotorByDisplayName(name : string | undefined) {
  return motorNameIndex.get(name?.toLowerCase() ?? '');
}

export function motorDisplayName(motor : Motor) {
  const { manufacturerAbbrev, designation, commonName, availability } = motor;
  return (
    manufacturerAbbrev + ' ' +
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
 * Calculate pad thrust of rocket motors
 * @returns {Number | NaN} Sum of all stage-1 motor thrust in Newtons, or NaN if thrust cannot be accurately determined
 */
export function padThrust(card : iCard) {
  const motors = card?.motors?.filter(m => (m.stage ?? 1) === 1);

  if (!motors?.length) return NaN;

  return motors
    .reduce((t, m) => {
      const thrust = /[a-z]([\d.]+)/i.test(m.name ?? '') && RegExp.$1;
      return t + (thrust ? unitParse(thrust, MKS.force) : NaN);
    }, 0);
}
