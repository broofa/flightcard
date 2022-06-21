import React from 'react';
import { ButtonGroup } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { useLaunch } from '../contexts/LaunchContext';
import { LinkButton, Loading } from '/components/common/util';
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

export function UsersPane() {
  const location = useLocation();
  const [launch] = useLaunch();
  const filter = new URLSearchParams(location.search).get('filter');

  if (!launch) return <Loading wat='Launch' />;

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
        <LinkButton
          isActive={() => !filter}
          to={`/launches/${launch.id}/users`}
        >
          All
        </LinkButton>
        <LinkButton
          isActive={() => filter == OFFICERS}
          to={`/launches/${launch.id}/users?filter=${OFFICERS}`}
        >
          {'\u2605'}
        </LinkButton>
        <LinkButton
          isActive={() => filter == LOW_POWER}
          to={`/launches/${launch.id}/users?filter=${LOW_POWER}`}
        >
          LP
        </LinkButton>
        <LinkButton
          isActive={() => filter == HIGH_POWER}
          to={`/launches/${launch.id}/users?filter=${HIGH_POWER}`}
        >
          HP
        </LinkButton>
      </ButtonGroup>

      <UserList launchId={launch.id} filter={userFilter}>
        {title}
      </UserList>
    </>
  );
}
