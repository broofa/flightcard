import { Fragment } from 'react';
import { Card } from 'react-bootstrap';
import { arrayGroup, arraySort } from '../../../util/array-util';
import { cardMotors, useFlownCards } from '../stat_hooks';
import { useMotorDB } from '/util/MotorDB-hook';

export function MotorsByManufacturer() {
  const motorDB = useMotorDB();
  const motors = cardMotors(useFlownCards());

  const entries = [
    ...arrayGroup(
      motors,
      (motor) =>
        motorDB?.getMotor(motor.tcMotorId ?? '')?.manufacturerAbbrev ??
        '(unknown)'
    ),
  ];

  arraySort(entries, ([, motors]) => -motors.length);

  return (
    <Card>
      <Card.Title className='text-center'>
        Motors Flown by Manufacturer
      </Card.Title>
      <Card.Body className='statlist'>
        {entries.map(([manufacturer, motors]) => {
          return (
            <Fragment key={manufacturer}>
              <div>{manufacturer}</div>
              <div>{motors.length}</div>
            </Fragment>
          );
        })}
      </Card.Body>
    </Card>
  );
}
