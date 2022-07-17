import React from 'react';
import { Card } from 'react-bootstrap';
import {
  Bar,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
} from 'victory';
import {cardMotors, useFlownCards} from '../stat_hooks';
import { CardStatus, iMotor } from '/types';
import { arrayGroup } from '/util/arrayUtils';
import { IMPULSE_CLASSES, motorClassForImpulse } from '/util/motor-util';

export function MotorsByClass() {
  const motors = cardMotors(useFlownCards());

  const byCert = arrayGroup(
    motors,
    motor => motorClassForImpulse(motor?.impulse ?? 0) ?? 'unknown'
  );

  const minIndex = Math.min(
    ...Object.keys(byCert).map(v => IMPULSE_CLASSES.indexOf(v))
  );
  const maxIndex = Math.max(
    ...Object.keys(byCert).map(v => IMPULSE_CLASSES.indexOf(v))
  );

  const data = IMPULSE_CLASSES.slice(minIndex, maxIndex + 1).map(imp => ({
    x: imp,
    y: byCert[imp]?.length ?? 0,
  }));

  return (
    <Card>
      <Card.Title className='text-center'>Motors Flown by Class</Card.Title>
      <Card.Body>
        <VictoryChart domainPadding={{ x: [50, 0] }}>
          <VictoryAxis dependentAxis />
          <VictoryAxis tickLabelComponent={<VictoryLabel textAnchor='end' />} />
          <VictoryBar dataComponent={<Bar />} data={data} />
        </VictoryChart>
      </Card.Body>
    </Card>
  );
}
