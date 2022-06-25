import React from 'react';
import { Card, Nav } from 'react-bootstrap';
import { FCLink } from '../common/FCLink';
import { FCLinkButton } from '../common/FCLinkButton';
import { useMakeNewCard } from '../common/useMakeNewCard';
import { useLaunch } from '../contexts/LaunchContext';
import { useRoleAPI } from '../contexts/OfficersContext';
import { useAttendee } from '../contexts/rthooks';
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
  const [attendee] = useAttendee();
  const [launch] = useLaunch();
  const roleApi = useRoleAPI();

  const makeNewCard = useMakeNewCard();

  if (!attendee) return <Loading wat='Attendee' />;
  if (!launch) return <Loading wat='Launch' />;

  function launchUrl(suffix: string) {
    if (!launch?.id) throw Error('No launch id'); // Should never happen
    return `/launches/${launch.id}/${suffix}`;
  }

  const isOfficer = roleApi.isOfficer(attendee);

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
          <div className='flex-grow-1'>
            <h5 className='mt-3'>Spectators</h5>
            <FCLink to='lco'>Ride Along w/ Launch Control</FCLink>
            <FCLink to='users'>View Attendees</FCLink>
            <FCLink disabled to={launchUrl('/report')}>
              View Launch Stats
            </FCLink>
          </div>
        </Card>

        <Card className='d-flex flex-row'>
          <img
            className='me-4'
            src={IMAGES.FLIER.toString()}
            style={{ height: '12em' }}
          />
          <div className='flex-grow-1'>
            <h5 className='mt-3'>Fliers</h5>
            <FCLink to='cards'>My Flight Cards</FCLink>
            <Nav.Link onClick={makeNewCard}>Create a Flight Card</Nav.Link>
            <FCLink to='users?filter=officers'>View Club Officers</FCLink>
          </div>
        </Card>

        <Card className='d-flex flex-row '>
          <img
            className='me-4'
            src={IMAGES.OFFICER.toString()}
            style={{ height: '12em' }}
          />
          <div className='flex-grow-1'>
            <h5 className='mt-3'>Officers</h5>
            <FCLink disabled={!isOfficer} to='lco'>
              Launch Control Duty
            </FCLink>
            <FCLink disabled={!isOfficer} to='rso'>
              Range Safety Duty
            </FCLink>
            <FCLink disabled to='rso'>
              Registration Desk Duty
            </FCLink>
          </div>
        </Card>

        <Card className='d-flex flex-row '>
          <img
            className='me-4'
            src={IMAGES.OTHER.toString()}
            style={{ height: '12em' }}
          />
          <div className='flex-grow-1'>
            <h5 className='mt-3'>Other</h5>
            <FCLink to='/launches'>Other Launches</FCLink>
            <FCLink to='profile'>My Profile</FCLink>
            <FCLink to='/' onClick={() => auth.signOut()}>
              Log Out
            </FCLink>
          </div>
        </Card>
      </div>
    </>
  );
}
