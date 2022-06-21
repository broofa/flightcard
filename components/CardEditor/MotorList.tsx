import React from 'react';
import { Button, ButtonGroup, Image } from 'react-bootstrap';
import { Motor as TCMotor } from 'thrustcurve-db';
import { arrayGroup, arraySort } from '../../util/arrayUtils';
import { Sparky } from '../common/Sparky';
import { util } from '/rt';
import { CardFields, CARD_MOTORS_PATH } from '/rt/rtconstants';
import { iMotor } from '/types';
import { getMotor } from '/util/motor-util';

const tcLogo = new URL('/art/thrustcurve.svg', import.meta.url);

function MotorButton({
  motor,
  setEditMotor,
  setDetailMotor,
}: {
  motor: iMotor;
  setEditMotor: (motor: iMotor | undefined) => void;
  setDetailMotor: (motor: TCMotor | undefined) => void;
}) {
  const tcMotor = getMotor(motor.tcMotorId ?? '');
  return (
    <ButtonGroup className='d-flex' key={motor.id}>
      <Button
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
          <Image src={String(tcLogo)} style={{ height: '2.5em' }} />
        )}
      </Button>
    </ButtonGroup>
  );
}

export function MotorList({
  rtFields,
  setEditMotor,
  setDetailMotor,
}: {
  rtFields: CardFields;
  setEditMotor: (motor: iMotor | undefined) => void;
  setDetailMotor: (motor: TCMotor | undefined) => void;
}) {
  const [motors] = util.useValue<{ [motorId: string]: iMotor }>(
    CARD_MOTORS_PATH.with(rtFields)
  );

  // We need an ordered array of motors
  const motorItems = motors ? Object.values(motors) : [];
  const motorsByStage = arrayGroup(motorItems, motor => motor.stage ?? 1);
  const motorList = [];
  const stages = arraySort(Object.entries(motorsByStage), '0'); // Sort by stage
  for (const [stage, stageMotors] of stages) {
    if (stages.length > 1) {
      motorList.push(<h3 key={`stage-${stage}-label`}>Stage {stage}</h3>);
    }

    motorList.push(
      <div key={`stage-${stage}`} className='deck'>
        {stageMotors.map(motor => (
          <MotorButton
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
