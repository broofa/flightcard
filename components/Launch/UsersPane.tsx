import React from 'react';
import { ButtonGroup } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useLaunch } from '../contexts/rthooks';
import { UserList } from './UserList';
import { LinkButton, Loading } from '/components/common/util';
import { iAttendee, iPerm } from '/types';
import { getCertLevel } from '/util/cert-util';

const OFFICERS = 'officers';
const LOW_POWER = 'low';
const HIGH_POWER = 'high';
const ALL = 'all';

function officerUsers(user?: iAttendee, isOfficer?: iPerm) {
  return isOfficer ?? false;
}

function lowPowerUsers(user: iAttendee) {
  return getCertLevel(user) == 0;
}

function highPowerUsers(user: iAttendee) {
  return getCertLevel(user) > 0;
}

export function UsersPane() {
  let { filter } = useParams();
  const [launch] = useLaunch();

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
      filter = ALL;
      title = 'All Attendees';
      break;
  }

  return (
    <>
      <ButtonGroup className='mt-2'>
        <LinkButton
          isActive={() => filter === ALL}
          to={`/launches/${launch.id}/users/all`}
        >
          All
        </LinkButton>
        <LinkButton
          isActive={() => filter === OFFICERS}
          to={`/launches/${launch.id}/users/${OFFICERS}`}
        >
          {'\u2605'}
        </LinkButton>
        <LinkButton
          isActive={() => filter === LOW_POWER}
          to={`/launches/${launch.id}/users/${LOW_POWER}`}
        >
          LP
        </LinkButton>
        <LinkButton
          isActive={() => filter === HIGH_POWER}
          to={`/launches/${launch.id}/users/${HIGH_POWER}`}
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
