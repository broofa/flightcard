import React from 'react';
import { Card } from 'react-bootstrap';
import { Bar, VictoryBar, VictoryChart } from 'victory';
import { Loading } from '../../common/util';
import { useAttendees } from '../../contexts/rthooks';
import { arrayGroup, arraySort } from '/util/arrayUtils';
import certString from '/util/certString';

export function AttendeesByCert() {
  const [attendees] = useAttendees();

  if (!attendees) return <Loading wat='Attendees' />;

  const byCert = arrayGroup(Object.values(attendees), att =>
    certString(att.cert)
  );
  const data = Object.entries(byCert).map(([key, values]) => ({
    x: key,
    y: values.length,
  }));

  arraySort(data, 'x');

  return (
    <Card>
      <Card.Title className='text-center'>
        Attendees by Certification
      </Card.Title>
      <Card.Body>
        <VictoryChart domainPadding={{ x: 50 }}>
          <VictoryBar dataComponent={<Bar />} data={data} />
        </VictoryChart>
      </Card.Body>
    </Card>
  );
}
