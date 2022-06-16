import { nanoid } from 'nanoid';
import React, { useContext, useState } from 'react';
import { Motor as TCMotor } from 'thrustcurve-db';
import { sortArray } from '../../util/sortArray';
// @ts-ignore: parcel module resolution handles this
import { AppContext } from '../App/App';
import { MotorItem } from './MotorItem';
import { MotorModal } from './MotorModal';
import { util } from '/firebase';
import { iMotor } from '/types';

export function isPlaceholderMotor(motor: iMotor) {
  return (
    !motor.name && !motor.impulse && !motor.delay && !!(motor.stage ?? 1 === 1)
  );
}

export function MotorList({
  launchId,
  cardId,
}: {
  launchId: string;
  cardId: string;
}) {
  const MOTOR_PATH = `/cards/${launchId}/${cardId}/motors`;
  const { userUnits } = useContext(AppContext);
  const [motorDetail, setMotorDetail] = useState<TCMotor>();
  const motors = util.useValue<{[motorId: string]: iMotor}>(MOTOR_PATH);

  // We need an ordered array of motors
  const motorEntries = motors ? Object.entries(motors) : [];

  // Add a placeholder motor if there isn't one
  if (!motorEntries.some(([, motor]) => isPlaceholderMotor(motor))) {
    const id = nanoid();
    motorEntries.push([id, {id}]);
  }

  // Sort by stage (w/ placeholder motor at the end)
  sortArray(motorEntries, ([, motor]) => {
    return isPlaceholderMotor(motor) ? 1 : (motor.stage ?? 1)
  })

  const motorList = motorEntries.map(([motorId, motor]) => {
    return (
      <MotorItem
        key={motor.id}
        rtPath={`${MOTOR_PATH}/${motorId}`}
        motor={motor}
        onDetail={setMotorDetail}
        className='mb-3'
      />
    )
  });

  return (
    <>
      <div>
        <div className='d-none d-sm-flex'>
          <div className='d-flex flex-grow-1'>
            <div className='text-secondary text-center flex-grow-1 ms-sm-2'>
              Motor
            </div>
            <div
              className='text-secondary text-center ms-sm-2'
              style={{ width: '4em' }}
            >
              I<sub>t</sub>
              <span className='text-info small ms-1'>
                ({userUnits.impulse})
              </span>
            </div>
          </div>

          <div
            className='text-secondary text-center ms-sm-2'
            style={{ width: '5em' }}
          >
            Delay
            <span className='text-info small ms-1'>(s)</span>
          </div>

          <div
            className='text-secondary text-center ms-sm-2'
            style={{ width: 'auto' }}
          >
            Stage
          </div>

          <div
            className='text-secondary text-center ms-sm-4'
            style={{ width: '2.5em' }}
          ></div>
        </div>

        {motorList}
      </div>

      {motorDetail ? (
        <MotorModal
          motor={motorDetail}
          onHide={() => setMotorDetail(undefined)}
        />
      ) : null}
    </>
  );
}
