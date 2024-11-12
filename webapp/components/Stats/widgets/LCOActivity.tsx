import { Fragment } from 'react';
import { Card } from 'react-bootstrap';
import { useFlownCards } from '/components/Stats/stat_hooks';
import { Loading } from '/components/common/util';
import { useAttendees } from '/components/contexts/rt_hooks';
import { arrayGroup, arraySort } from '/util/array-util';

export default function LCOActivity() {
  const flownCards = useFlownCards();
  const [attendees] = useAttendees();

  if (!attendees) return <Loading wat='Attendees' />;

  const flightsByLCO = [...arrayGroup(flownCards, (card) => card.lcoId ?? '')];

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
