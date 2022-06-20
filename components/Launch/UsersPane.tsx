import React from 'react';
import { ButtonGroup } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { LinkButton } from '/components/common/util';
import { UserList } from '/components/UserList';
import { iAttendee, iPerm } from '/types';

export const OFFICERS = 'officers';
export const LOW_POWER = 'low';
export const HIGH_POWER = 'high';

function officerUsers(user?: iAttendee, isOfficer?: iPerm) {
  return isOfficer ?? false;
}

function lowPowerUsers(user: iAttendee) {
  return (user.cert?.level ?? 0) == 0;
}

function highPowerUsers(user: iAttendee) {
  return (user.cert?.level ?? 0) > 0;
}

export function UsersPane({ launchId }: { launchId: string }) {
  const location = useLocation();
  const filter = new URLSearchParams(location.search).get('filter');

  let title, userFilter;
  switch (filter) {
    case OFFICERS:
      title = '\u2605 Officers';
      userFilter = officerUsers;
      break;
    case LOW_POWER:
      title = 'Low Power Attendees';
      userFilter = lowPowerUsers;
      break;
    case HIGH_POWER:
      title = 'High Power Attendees';
      userFilter = highPowerUsers;
      break;
    default:
      title = 'All Attendees';
      break;
  }

  return (
    <>
      <ButtonGroup className='mt-2'>
        <LinkButton isActive={() => !filter} to={`/launches/${launchId}/users`}>
          All
        </LinkButton>
        <LinkButton
          isActive={() => filter == OFFICERS}
          to={`/launches/${launchId}/users?filter=${OFFICERS}`}
        >
          {'\u2605'}
        </LinkButton>
        <LinkButton
          isActive={() => filter == LOW_POWER}
          to={`/launches/${launchId}/users?filter=${LOW_POWER}`}
        >
          LP
        </LinkButton>
        <LinkButton
          isActive={() => filter == HIGH_POWER}
          to={`/launches/${launchId}/users?filter=${HIGH_POWER}`}
        >
          HP
        </LinkButton>
      </ButtonGroup>

      <UserList launchId={launchId} filter={userFilter}>
        {title}
      </UserList>
    </>
  );
}
