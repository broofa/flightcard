import { Card } from 'react-bootstrap';
import {
  Bar,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
} from 'victory';
import { cardMotors, useFlownCards } from '../stat_hooks';
import { arrayGroup } from '/util/array-util';
import { IMPULSE_CLASSES, motorClassForImpulse } from '/util/motor-util';

export function MotorsByClass() {
  const motors = cardMotors(useFlownCards());

  const impulses = motors
    .map((motor) => motor.impulse ?? 0)
    .filter((impulse) => impulse > 0);

  let body = <div>No motors found</div>;

  if (impulses.length > 0) {
    const range = { min: impulses[0], max: impulses[0] };
    for (const impulse of impulses) {
      range.min = Math.min(range.min, impulse);
      range.max = Math.max(range.max, impulse);
    }

    // Get names of all impulse classes that are in the range of the motors flown
    const impulsesInRange = IMPULSE_CLASSES.filter(({ min, max }) => {
      return max > range.min && min < range.max;
    });

    const byCert = arrayGroup(
      motors,
      (motor) => motorClassForImpulse(motor.impulse) ?? 'unknown'
    );

    const data = impulsesInRange.map(({ name }) => ({
      x: name,
      y: byCert.get(name)?.length ?? 0,
    }));

    body = (
      <VictoryChart domainPadding={{ x: [50, 0] }}>
        <VictoryAxis dependentAxis />
        <VictoryAxis tickLabelComponent={<VictoryLabel textAnchor='end' />} />
        <VictoryBar dataComponent={<Bar />} data={data} />
      </VictoryChart>
    );
  }

  return (
    <Card>
      <Card.Title className='text-center'>Motors Flown by Class</Card.Title>
      <Card.Body>{body}</Card.Body>
    </Card>
  );
}
