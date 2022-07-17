import React, { Fragment } from 'react';
import { Card } from 'react-bootstrap';
import { Loading } from '../../common/util';
import { useAttendees, useCards } from '../../contexts/rthooks';
import { arrayGroup, arraySort } from '/util/arrayUtils';

export default function RSOActivity() {
  const [cards] = useCards();
  const [attendees] = useAttendees();

  if (!cards) return <Loading wat='Cards' />;
  if (!attendees) return <Loading wat='Attendees' />;

  const cardsByRSO = Object.entries(
    arrayGroup(Object.values(cards), card => card.rsoId ?? '')
  );
  arraySort(cardsByRSO, ([, cards]) => -cards.length);

  return (
    <Card>
      <Card.Title className='text-center'>RSO Activity</Card.Title>
      <Card.Body className='statlist'>
        <div className='text-center fw-bold'>RSO</div>
        <div className='fw-bold'>Rockets Reviewed</div>
        {cardsByRSO.map(([userId, cards]) => {
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
