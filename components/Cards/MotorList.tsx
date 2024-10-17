import React from 'react';
import { Button, ButtonGroup, Image } from 'react-bootstrap';
import { TCMotor } from 'thrustcurve-db';
import { arrayGroup, arraySort } from '../../util/array-util';
import { Sparky } from '../common/Sparky';
import { useRTValue } from '/rt';
import { CARD_MOTORS_PATH, CardFields } from '/rt/rtconstants';
import { iMotor } from '/types';
import { getMotor } from '/util/motor-util';

import LOGO_THRUSTCURVE from '/media/logos/logo-thrustcurve.svg';

function MotorButton({
  motor,
  disabled,
  setEditMotor,
  setDetailMotor,
}: {
  motor: iMotor;
  disabled: boolean;
  setEditMotor: (motor: iMotor | undefined) => void;
  setDetailMotor: (motor: TCMotor | undefined) => void;
}) {
  const tcMotor = getMotor(motor.tcMotorId ?? '');
  return (
    <ButtonGroup className='d-flex' key={motor.id}>
      <Button
        disabled={disabled}
        className='flex-grow-1'
        variant='outline-dark'
        onClick={() => setEditMotor(motor)}
      >
        {motor.name}
      </Button>
      <Button
        onClick={() => setDetailMotor(tcMotor)}
        className='flex-grow-0 p-0'
        disabled={!motor.tcMotorId}
        style={{
          backgroundColor: '#0793d6',
          filter: tcMotor ? '' : 'grayscale(1)',
        }}
      >
        {tcMotor?.sparky ? (
          <Sparky style={{ width: '40px' }} />
        ) : (
          <Image src={String(LOGO_THRUSTCURVE)} style={{ height: '2.5em' }} />
        )}
      </Button>
    </ButtonGroup>
  );
}

export function MotorList({
  disabled,
  rtFields,
  setEditMotor,
  setDetailMotor,
}: {
  disabled: boolean;
  rtFields: CardFields;
  setEditMotor: (motor: iMotor | undefined) => void;
  setDetailMotor: (motor: TCMotor | undefined) => void;
}) {
  const [motors] = useRTValue<{ [motorId: string]: iMotor }>(
    CARD_MOTORS_PATH.with(rtFields)
  );

  // We need an ordered array of motors
  const motorItems = motors ? Object.values(motors) : [];
  const stageGroupEntries = [
    ...arrayGroup(motorItems, (motor) => motor.stage ?? 1),
  ];

  // Sort by stage
  const stageGroups = arraySort(stageGroupEntries, '0');

  const motorList = [];
  for (const [stage, stageMotors] of stageGroups) {
    if (stageGroups.length > 1 || !stageGroups['1']) {
      motorList.push(<h3 key={`stage-${stage}-label`}>Stage {stage}</h3>);
    }

    motorList.push(
      <div key={`stage-${stage}`} className='deck'>
        {stageMotors.map((motor) => (
          <MotorButton
            disabled={disabled}
            key={motor.id}
            motor={motor}
            setEditMotor={setEditMotor}
            setDetailMotor={setDetailMotor}
          />
        ))}
      </div>
    );
  }
  return <>{motorList}</>;
}
