import React, { useContext, useState } from 'react';
import { Motor } from 'thrustcurve-db';
import { sortArray } from '../../util/sortArray';
// @ts-ignore: parcel module resolution handles this
import { AppContext } from '../App/App';
import { MotorItem } from './MotorItem';
import { MotorModal } from './MotorModal';
import { iMotor } from '/types';

export const BLANK_ID = 'blank_id';

type BlankableMotor = iMotor & { isBlank?: boolean };

export function MotorList({
  motors = [],
  onChange,
}: {
  motors: BlankableMotor[];
  onChange: (motors: iMotor[]) => void;
}) {
  const { userUnits } = useContext(AppContext);
  const [motorDetail, setMotorDetail] = useState<Motor>();

  const motorModal = motorDetail ? (
    <MotorModal motor={motorDetail} onHide={() => setMotorDetail(undefined)} />
  ) : null;

  // Blank motor to allow adding new ones
  const _motors = [...motors];
  if (!_motors.some(m => m.id === BLANK_ID)) {
    _motors.push({ name: '', id: BLANK_ID });
  }

  return (
    <>
      <div>
        <div className='d-none d-sm-flex'>
          <div className='d-flex flex-grow-1'>
            <div className='text-secondary text-center flex-grow-1 ms-sm-3'>
              Motor
            </div>
            <div
              className='text-secondary text-center ms-sm-3'
              style={{ width: '4em' }}
            >
              I<sub>t</sub>
              <span className='text-info small ms-1'>
                ({userUnits.impulse})
              </span>
            </div>
          </div>

          <div
            className='text-secondary text-center ms-sm-3'
            style={{ width: '5em' }}
          >
            Delay
            <span className='text-info small ms-1'>(s)</span>
          </div>

          <div
            className='text-secondary text-center ms-sm-3'
            style={{ width: 'auto' }}
          >
            Stage
          </div>

          <div
            className='text-secondary text-center ms-sm-3'
            style={{ width: '3em' }}
          ></div>
        </div>
        {_motors.map(m => {
          const key = m.id;

          function handleChange(motor) {
            const newMotors = [..._motors];
            const i = newMotors.findIndex(m => m.id === key);

            if (i < 0) throw Error(`Huh? Motor ${key} went away :-(`);

            if (!motor?.name) {
              newMotors.splice(i, 1);
            } else {
              const stageChanged = newMotors[i].stage != motor.stage;
              newMotors[i] = motor;
              // Sort motors if order may have changed
              if (stageChanged) {
                sortArray(newMotors, m =>
                  m.id === BLANK_ID ? Infinity : m.stage ?? 1
                );
              }
            }

            onChange(newMotors.filter(m => m.id !== BLANK_ID));
          }

          return (
            <MotorItem
              key={m.id}
              className='mb-3'
              motor={m}
              onDetail={setMotorDetail}
              onChange={handleChange}
            />
          );
        })}
      </div>

      {motorModal}
    </>
  );
}
