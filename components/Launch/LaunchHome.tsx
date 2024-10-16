import React from 'react';
import { Card, Nav } from 'react-bootstrap';
import ProfileName from '../Profile/NamePref';
import { FCLink } from '../common/FCLink';
import { FCLinkButton } from '../common/FCLinkButton';
import { useMakeNewCard } from '../common/useMakeNewCard';
import { useIsOfficer } from '../contexts/officer_hooks';
import { useCurrentAttendee, useLaunch } from '../contexts/rt_hooks';
import Icon from '/components/common/Icon';
import { Loading } from '/components/common/util';
import { auth } from '/rt';

import SIDE_FLIER from '/art/home_fly.webp';
import SIDE_OFFICER from '/art/home_officiate.webp';
import SIDE_OTHER from '/art/home_other.webp';
import SIDE_SPECTATOR from '/art/home_spectate.webp';

export default function LaunchHome() {
  const [attendee] = useCurrentAttendee();
  const [launch] = useLaunch();
  const isOfficer = useIsOfficer();

  const makeNewCard = useMakeNewCard();

  if (!attendee) return <Loading wat='Attendee' />;
  if (!launch) return <Loading wat='Launch (home)' />;

  function launchUrl(suffix: string) {
    if (!launch?.id) throw Error('No launch id'); // Should never happen
    return `/launches/${launch.id}/${suffix}`;
  }

  if (!attendee.name) {
    return (
      <>
        <h2>"Hi, My Name Is..."</h2>
        <div className='text-tip'>
          Knowing who's here helps keep the launch safe and fun! You can always
          change this later in <FCLink to='profile'>Your Profile</FCLink>
        </div>

        <ProfileName
          attendeeFields={{ launchId: launch.id, userId: attendee.id }}
        />
        <FCLinkButton className='mt-3' to={'.'}>
          Done
        </FCLinkButton>
      </>
    );
  }

  return (
    <>
      <div className='d-flex mb-2'>
        <h2 className='flex-grow-1'>Welcome to {launch.name}</h2>
        {isOfficer ? (
          <FCLinkButton className='btn-sm text-nowrap my-auto ms-2' to='edit'>
            <Icon name='pencil-fill' /> Edit
          </FCLinkButton>
        ) : null}
      </div>

      <div
        className='d-grid'
        style={{
          gap: '1em',
          gridTemplateColumns: 'repeat(auto-fit, minmax(20em, 1fr))',
        }}
      >
        <Card className='d-flex flex-row'>
          <img
            className='me-4'
            src={SIDE_SPECTATOR.toString()}
            style={{ height: '12em' }}
          />
          <div className='flex-grow-1 nav flex-column'>
            <h5 className='mt-3'>Spectators</h5>
            <FCLink to='users/all'>View Attendees</FCLink>
            <FCLink to='ridealong'>Ride Along With Launch Control</FCLink>
            <FCLink to={launchUrl('report')}>See Launch Stats</FCLink>
          </div>
        </Card>

        <Card className='d-flex flex-row'>
          <img
            className='me-4'
            src={SIDE_FLIER.toString()}
            style={{ height: '12em' }}
          />
          <div className='flex-grow-1 nav flex-column'>
            <h5 className='mt-3'>Fliers</h5>
            <FCLink to='cards'>My Flight Cards</FCLink>
            <Nav.Link onClick={makeNewCard}>New Flight Card</Nav.Link>
            <FCLink to='users/officers'>View Club Officers</FCLink>
          </div>
        </Card>

        {isOfficer ? (
          <Card className='d-flex flex-row '>
            <img
              className='me-4'
              src={SIDE_OFFICER.toString()}
              style={{ maxHeight: '12em' }}
            />
            <div className='flex-grow-1 nav flex-column'>
              <h5 className='mt-3'>Officers</h5>
              <FCLink to='tools'>
                Registration Desk
              </FCLink>
              <FCLink to='rso'>Range Safety</FCLink>
              <FCLink to='lco'>Launch Control</FCLink>
            </div>
          </Card>
        ) : null}

        <Card className='d-flex flex-row '>
          <img
            className='me-4'
            src={SIDE_OTHER.toString()}
            style={{ height: '13em' }}
          />
          <div className='flex-grow-1 nav flex-column'>
            <h5 className='mt-3'>Other</h5>
            <FCLink to='/launches'>Other Launches</FCLink>
            <FCLink to='profile'>My Profile</FCLink>{' '}
            <a
              className='nav-link'
              rel='noreferrer'
              target='_blank'
              href='https://github.com/broofa/flightcard/discussions'
            >
              Support (Github)
            </a>
            <FCLink to='/' onClick={() => auth.signOut()}>
              Log Out
            </FCLink>
          </div>
        </Card>
      </div>
    </>
  );
}
