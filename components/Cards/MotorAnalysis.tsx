import React from 'react';
import { Alert } from 'react-bootstrap';
import { getMotor } from '../../util/motor-util';
import { MKS, unitConvert } from '../../util/units';
import { useUserUnits } from '../contexts/rthooks';
import { sig } from '/components/common/util';
import { useRTValue } from '/rt';
import {
  CardFields,
  CARD_MOTORS_PATH,
  ROCKET_MASS_PATH
} from '/rt/rtconstants';
import { iCard, iRocket } from '/types';

// Force of gravity (m/^2)
export const GRAVITY_ACC = 9.807;

// Minimum velocity needed for rocket to be aerodynamically stable (m/s)
const STABLE_SPEED = 13.89;

const THRUST_RATIO_MIN = 4;
const THRUST_RATIO_GOOD = 5;

export default function MotorAnalysis({ rtFields }: { rtFields: CardFields }) {
  const [userUnits = MKS] = useUserUnits();

  const [mass] = useRTValue<iRocket['mass']>(ROCKET_MASS_PATH.with(rtFields));
  const [motors] = useRTValue<iCard['motors']>(CARD_MOTORS_PATH.with(rtFields));

  // Don't show if there's no motors
  if (!motors || !Object.entries(motors).length) {
    return null;
  }

  const stage1Motors = Object.values(motors).filter(m => (m.stage ?? 1) === 1);

  // There should be at least one stage 1 motor
  if (!stage1Motors.length) {
    return (
      <Alert className='mt-3 p-2' variant='warning'>
        No stage 1? Now you're just being silly.
      </Alert>
    );
  }

  // Analysis requires rocket mass
  if (mass == null) {
    return (
      <Alert className='mt-3 p-2' variant='warning'>
        Enter rocket mass to enable thrust analysis
      </Alert>
    );
  }

  // Compute total thrust of all stage 1 motors
  const stage1Thrust = stage1Motors.reduce((acc, motor) => {
    let thrust = getMotor(motor.tcMotorId ?? '')?.avgThrustN ?? NaN;

    // Scrape thrust from motor name
    if (isNaN(thrust)) {
      const match = motor.name?.match(/\b[a-q]-?([\d.]+)\b/i)?.[1];
      thrust = match ? parseInt(match) : NaN;
    }
    return acc + thrust;
  }, 0);

  if (isNaN(stage1Thrust)) {
    return (
      <Alert className='mt-3 p-2' variant='warning'>
        Unable to compute total thrust. Make sure thrust is mentioned in each
        stage 1 motor name using standard <code>letter-thrust</code> notation.
        (E.g. "Estes D12" or "Experimental J-350"){' '}
      </Alert>
    );
  }

  const thrustToWeightRatio = stage1Thrust / (mass * GRAVITY_ACC);

  // Compute rail travel needed for safe flight (meters)
  const acc = stage1Thrust / mass - GRAVITY_ACC;
  const time = STABLE_SPEED / acc; // 50km/h = 45.6 ft/s = 13.89m/s
  const railTravel = (1 / 2) * acc * time ** 2;

  let alertVariant = 'danger';
  let thrustResult = null;
  let railResult = null;
  if (thrustToWeightRatio <= 1) {
    thrustResult = (
      <>
        Hmm... Check your mass and motor. A stage-1 thrust:weight ratio of{' '}
        <strong>{sig(thrustToWeightRatio, 2)} : 1</strong> means this rocket
        probably isn't leaving the pad, let alone achieving safe flight.{' '}
        {'\u{1F62D}'}
      </>
    );
  } else {
    alertVariant = thrustToWeightRatio < THRUST_RATIO_MIN ? 'danger' : thrustToWeightRatio < THRUST_RATIO_GOOD ? 'warning' : 'success';
    thrustResult = (
      <div>
        Stage 1 thrust:weight ratio is{' '}
        <strong>{sig(thrustToWeightRatio, 2)} : 1</strong>
      </div>
    );

    railResult = (
      <div className='mt-2'>
        Provide at least{' '}
        <strong>
          {sig(unitConvert(railTravel, MKS.length, userUnits.length), 2)}{' '}
          {userUnits.length}
        </strong>{' '}
        of rail travel to reach a safe-flight speed of{' '}
        {sig(unitConvert(STABLE_SPEED, MKS.speedSmall, userUnits.speed), 2)}{' '}
        {userUnits.speed}
      </div>
    );
  }

  return (
    <Alert className='mt-3 p-2' variant={alertVariant}>
      {thrustResult}
      {railResult}
      <details
        className='mt-2 ps-2 align-middle border border-dark rounded'
        style={{ backgroundColor: 'rgba(255, 255, 255, .5)' }}
      >
        <summary className='text-center'>
          <span className='mx-1' style={{ fontSize: '1.5em' }}>
            {'\u{26a0} '}
          </span>
          Don't trust this!
          <span className='text-tip ms-2'>(click for details)</span>
          <span className='mx-1' style={{ fontSize: '1.5em' }}>
            {'\u{26a0} '}
          </span>
        </summary>
        <p>
          This analysis feature is experimental. It is based on data that may be
          incorrect. Furthermore, it uses simplistic calculations that only
          crudely approximate real-world behavior. Recommendations provided here
          are, at best, based on "rule of thumb" principles. They should in no
          way be seen as authoritative.
        </p>
        <p>
          I.e. Treat this as advice from a stranger you've never met, because
          unless you've met the author of this software... well... that's
          exactly what you're getting.
        </p>
      </details>
    </Alert>
  );
}
