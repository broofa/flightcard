import React from 'react';
import { Alert } from 'react-bootstrap';
import { Loading } from '/components/common/util';
import { CardStatus } from '../../types';
import { arraySort } from '../../util/array-util';
import RolePref from '../Profile/RolePref';
import { useIsOfficer } from '../contexts/officer_hooks';
import {
  useAttendees,
  useCards,
  useCurrentAttendee,
  useLaunch,
} from '../contexts/rt_hooks';
import { LaunchCard } from './LaunchCard';

export function RSOPane() {
  const [launch] = useLaunch();
  const [user] = useCurrentAttendee();
  const [cards] = useCards();
  const [attendees] = useAttendees();
  const isOfficer = useIsOfficer();

  if (!attendees) return <Loading wat='Users' />;

  const rsoCards = Object.values(cards || {}).filter(
    (c) => c.status === CardStatus.REVIEW
  );
  arraySort(rsoCards, (card) => attendees[card.userId].name ?? '');

  return (
    <>
      {isOfficer ? (
        <div className='d-flex justify-content-center align-items-baseline mb-3'>
          <div className='me-2'>My Status: </div>
          <RolePref launchId={launch?.id ?? ''} userId={user?.id ?? ''} />
        </div>
      ) : null}

      <h2>RSO Requests</h2>
      <div>
        {rsoCards.length ? (
          rsoCards.map((card) => (
            <LaunchCard
              className='mt-2'
              key={card.id}
              card={card}
              summary={true}
            />
          ))
        ) : (
          <Alert variant='secondary'>No RSO requests at this time.</Alert>
        )}
      </div>
    </>
  );
}
