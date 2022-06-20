import React from 'react';
import { Alert } from 'react-bootstrap';
import { padThrust } from '../../util/motor-util';
import { MKS, unitConvert } from '../../util/units';
import { useUserUnits } from '../contexts/derived';
import { sig } from '/components/common/util';
import {
  CardFields,
  CARD_MOTORS_PATH,
  CARD_ROCKET_PATH,
  util,
} from '/firebase';
import { iCard, iRocket } from '/types';

// Force of gravity (m/^2)
const GRAVITY_ACC = 9.8066500286389;
const MIN_VELOCITY = 13.89; // meters/second

export default function MotorAnalysis({ rtFields }: { rtFields: CardFields }) {
  const [userUnits = MKS] = useUserUnits();

  const mass = util.useSimpleValue<iRocket['mass']>(
    CARD_ROCKET_PATH.append('mass').with(rtFields)
  );
  const motors = util.useSimpleValue<iCard['motors']>(
    CARD_MOTORS_PATH.with(rtFields)
  );

  if (!motors?.length) {
    return null;
  }

  if (mass == null) {
    return (
      <Alert className='mt-3 p-2' variant='warning'>
        Thrust:weight analysis requires rocket mass
      </Alert>
    );
  }

  // Thrust:weight analysis
  const thrust = padThrust(motors);

  if (isNaN(thrust)) {
    return (
      <Alert className='mt-3 p-2' variant='warning'>
        Unable to determine total thrust for analysis
      </Alert>
    );
  }
  const thrustRatio = thrust / (mass * GRAVITY_ACC);

  // Rail travel analysis
  const acc = thrust / mass - GRAVITY_ACC;
  const time = MIN_VELOCITY / acc; // 50km/h = 45.6 ft/s = 13.89m/s
  const dist = (1 / 2) * acc * time ** 2;

  let alertBody;
  let alertVariant;
  if (isNaN(thrustRatio)) {
    return null;
  } else if (thrustRatio < 1) {
    alertVariant = 'danger';
    alertBody = (
      <>
        Stage 1 thrust:weight ratio is{' '}
        <strong>{sig(thrustRatio, 2)} : 1</strong>. Rocket is unlikely to leave
        pad!
      </>
    );
  } else {
    alertVariant = thrustRatio < 5 ? 'danger' : 'success';
    alertBody = (
      <>
        {' '}
        Stage 1 thrust:weight ratio is{' '}
        <strong>{sig(thrustRatio, 2)} : 1</strong>
        <br />
        Rail travel needed for stable flight is ~
        <strong>
          {sig(unitConvert(dist, MKS.length, userUnits.length), 2)}{' '}
          {userUnits.length}
        </strong>
      </>
    );
  }

  return (
    <>
      {isNaN(thrustRatio) ? null : (
        <Alert className='mt-3 p-2' variant={alertVariant}>
          {alertBody}
        </Alert>
      )}
    </>
  );
}
