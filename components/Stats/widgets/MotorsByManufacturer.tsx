import React, { Fragment } from 'react';
import { Card } from 'react-bootstrap';
import { cardMotors, useFlownCards } from '../stat_hooks';
import { arrayGroup, arraySort } from '/util/arrayUtils';
import { getMotor } from '/util/motor-util';

export function MotorsByManufacturer() {
  const motors = cardMotors(useFlownCards());

  const entries = Object.entries(
    arrayGroup(
      motors,
      motor =>
        getMotor(motor.tcMotorId ?? '')?.manufacturerAbbrev ?? '(unknown)'
    )
  );

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
