import React from 'react';
import { Alert } from 'react-bootstrap';
import { useLaunch } from '../contexts/LaunchContext';
import { useIsOfficer, useRoleAPI } from '../contexts/OfficersContext';
import {
  useAttendees,
  useCards,
  useCurrentAttendee,
} from '../contexts/rthooks';
import RolePref from '../Profile/RolePref';
import { CardList } from './Launch';
import { Loading } from '/components/common/util';
import { CardStatus } from '/types';

export function RangeSafetyPane() {
  const [launch] = useLaunch();
  const [user] = useCurrentAttendee();
  const [cards] = useCards();
  const [attendees] = useAttendees();
  const isOfficer = useIsOfficer();

  if (!attendees) return <Loading wat='Users' />;

  const rsoCards = Object.values(cards || {}).filter(
    c => c.status == CardStatus.REVIEW
  );

  return (
    <>
      {isOfficer ? (
        <div className='d-flex justify-content-center align-items-baseline mb-3'>
          <div className='me-2'>My Status: </div>
          <RolePref launchId={launch?.id ?? ''} userId={user?.id ?? ''} />
        </div>
      ) : null}

      <h2>RSO Requests</h2>
      {rsoCards?.length ? (
        <CardList cards={rsoCards} attendees={attendees} />
      ) : (
        <Alert variant='secondary'>No RSO requests at this time.</Alert>
      )}
    </>
  );
}
