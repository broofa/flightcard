import React from 'react';
import { Alert } from 'react-bootstrap';
import { sig } from '/components/common/util';
import { useRTValue } from '/rt';
import {
  CARD_MOTORS_PATH,
  type CardFields,
  ROCKET_MASS_PATH,
} from '/rt/rtconstants';
import { getMotor } from '/util/motor-util';
import { MKS, unitConvert } from '/util/units';
import type { iCard, iRocket } from '../../types';
import { MEME_INTERESTING, Meme } from '../Launch/Meme';
import { useUserUnits } from '../contexts/rt_hooks';

// Force of gravity (m/^2)
export const GRAVITY_ACC = 9.807;

// Minimum velocity needed for rocket to be aerodynamically stable (m/s)
const STABLE_SPEED = 13.89;

const THRUST_RATIO_MIN = 3;
const THRUST_RATIO_GOOD = 5;

export default function MotorAnalysis({ rtFields }: { rtFields: CardFields }) {
  const [userUnits = MKS] = useUserUnits();

  const [mass] = useRTValue<iRocket['mass']>(ROCKET_MASS_PATH.with(rtFields));
  const [motors] = useRTValue<iCard['motors']>(CARD_MOTORS_PATH.with(rtFields));

  // Don't show if there's no motors
  if (!motors || !Object.entries(motors).length) {
    return null;
  }

  const stage1Motors = Object.values(motors).filter(
    (m) => (m.stage ?? 1) === 1
  );

  // There should be at least one stage 1 motor
  if (!stage1Motors.length) {
    return (
      <Meme
        className='mt-3 p-2'
        meme={MEME_INTERESTING}
        style={{ height: '50cqmin', width: '20em' }}
        topText='No Stage 1 motors?'
        bottomText='... very interesting'
      />
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
    let thrust = getMotor(motor.tcMotorId ?? '')?.avgThrustN ?? Number.NaN;

    // Scrape thrust from motor name
    if (Number.isNaN(thrust)) {
      const match = motor.name?.match(/\b[a-q]-?([\d.]+)\b/i)?.[1];
      thrust = match ? Number.parseInt(match) : Number.NaN;
    }
    return acc + thrust;
  }, 0);

  if (Number.isNaN(stage1Thrust)) {
    return (
      <Alert className='mt-3 p-2' variant='warning'>
        Unable to compute total thrust. Make sure the average thrust is
        mentioned in each motor name using <code>letter-thrust</code> notation.
        (E.g. "D12" or "J-350")
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
        probably isn't leaving the pad, let alone achieving stable flight.{' '}
        {'\u{1F62D}'}
      </>
    );
  } else {
    alertVariant =
      thrustToWeightRatio < THRUST_RATIO_MIN
        ? 'danger'
        : thrustToWeightRatio < THRUST_RATIO_GOOD
          ? 'warning'
          : 'success';
    thrustResult = (
      <div>
        Thrust<span style={{ fontSize: '80%', verticalAlign: 'sub' }}>avg</span>{' '}
        : Weight ratio (stage 1 motors only):{' '}
        <strong>{sig(thrustToWeightRatio, 2)} : 1</strong>
      </div>
    );

    railResult = (
      <div className='mt-2'>
        Distance needed to reach stable flight speed (
        {sig(unitConvert(STABLE_SPEED, MKS.speedSmall, userUnits.speed), 2)}{' '}
        {userUnits.speed}):{' '}
        <strong>
          {sig(unitConvert(railTravel, MKS.length, userUnits.length), 2)}{' '}
          {userUnits.length}
        </strong>{' '}
      </div>
    );
  }

  return (
    <Alert className='mt-3 p-0' variant={alertVariant}>
      <div className='p-2'>
        {thrustResult}
        {railResult}
      </div>

      <details className='m-1 p-1 rounded bg-light'>
        <summary
          className='p-1 small fst-italic'
          style={{ listStyleType: '"\\26a0"' }}
        >
          {''} Experimental feature (click for disclaimer &hellip;)
        </summary>

        <p>
          <strong>
            DO NOT ASSUME THIS ANALYSIS MEANS YOUR ROCKET CAN BE FLOWN SAFELY.
          </strong>{' '}
          This is an experimental feature based on crude approximations,
          potentially flawed assumptions, and limited data. It is not a
          substitute for a proper flight simulation. At most, it should be used
          as a sanity check of your own, independent analysis.
        </p>
      </details>
    </Alert>
  );
}
