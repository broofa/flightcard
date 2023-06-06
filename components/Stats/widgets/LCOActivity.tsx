import React, { Fragment } from 'react';
import { Card } from 'react-bootstrap';
import { Loading } from '../../common/util';
import { useAttendees } from '../../contexts/rt_hooks';
import { useFlownCards } from '../stat_hooks';
import { arrayGroup, arraySort } from '/util/arrayUtils';

export default function LCOActivity() {
  const flownCards = useFlownCards();
  const [attendees] = useAttendees();

  if (!attendees) return <Loading wat='Attendees' />;

  const flightsByLCO = Object.entries(
    arrayGroup(flownCards, card => card.lcoId ?? '')
  );

  arraySort(flightsByLCO, ([, cards]) => -cards.length);

  return (
    <Card>
      <Card.Title className='text-center'>LCO Activity</Card.Title>
      <Card.Body className='statlist'>
        <div className='text-center fw-bold'>Officer</div>
        <div className='fw-bold'>Flights Launched</div>
        {flightsByLCO.map(([userId, cards]) => {
          if (!cards.length) return null;
          const user = attendees[userId];
          if (!user) return null;
          return (
            <Fragment key={userId}>
              <div>{user?.name ?? '(unknown)'}</div>
              <div>{cards.length}</div>
            </Fragment>
          );
        })}
      </Card.Body>
    </Card>
  );
}
