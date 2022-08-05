import React from 'react';
import { Card, Nav } from 'react-bootstrap';
import { FCLink } from '../common/FCLink';
import { FCLinkButton } from '../common/FCLinkButton';
import { useMakeNewCard } from '../common/useMakeNewCard';
import { useIsOfficer } from '../contexts/OfficersContext';
import { useCurrentAttendee, useLaunch } from '../contexts/rthooks';
import ProfileName from '../Profile/ProfileName';
import Icon from '/components/common/Icon';
import { Loading } from '/components/common/util';
import { auth } from '/rt';

const IMAGES = {
  SPECTATOR: new URL('/art/home_spectate.webp', import.meta.url),
  FLIER: new URL('/art/home_fly.webp', import.meta.url),
  OFFICER: new URL('/art/home_officiate.webp', import.meta.url),
  OTHER: new URL('/art/home_other.webp', import.meta.url),
};

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
        <p>
          Please start by telling us your name:
          <div className='text-tip'>
            Knowing who's here helps keep the launchsafe and fun! You can always
            change this letter in <code>Settings</code>
          </div>
        </p>
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
            src={IMAGES.SPECTATOR.toString()}
            style={{ height: '12em' }}
          />
          <div className='flex-grow-1 nav flex-column'>
            <h5 className='mt-3'>Spectators</h5>
            <FCLink to='users'>View Attendees</FCLink>
            <FCLink to='lco'>Launch Control Ride-Along</FCLink>
            <FCLink to={launchUrl('report')}>See Launch Stats</FCLink>
          </div>
        </Card>

        <Card className='d-flex flex-row'>
          <img
            className='me-4'
            src={IMAGES.FLIER.toString()}
            style={{ height: '12em' }}
          />
          <div className='flex-grow-1 nav flex-column'>
            <h5 className='mt-3'>Fliers</h5>
            <FCLink to='cards'>My Flight Cards</FCLink>
            <Nav.Link onClick={makeNewCard}>New Flight Card</Nav.Link>
            <FCLink to='users?filter=officers'>View Club Officers</FCLink>
          </div>
        </Card>

        {isOfficer ? (
          <Card className='d-flex flex-row '>
            <img
              className='me-4'
              src={IMAGES.OFFICER.toString()}
              style={{ maxHeight: '12em' }}
            />
            <div className='flex-grow-1 nav flex-column'>
              <h5 className='mt-3'>Officers</h5>
              <FCLink disabled to='rso'>
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
            src={IMAGES.OTHER.toString()}
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
