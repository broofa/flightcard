import React from 'react';
import { Card } from 'react-bootstrap';
import { FCLink } from '../common/FCLink';
import { FCLinkButton } from '../common/FCLinkButton';
import { useLaunch } from '../contexts/LaunchContext';
import { useAttendee, useOfficers } from '../contexts/rthooks';
import ProfileName from '../Profile/ProfileName';
import Icon from '/components/common/Icon';
import { Loading } from '/components/common/util';
import { Waiver } from '/components/Waiver';

const spectateImage = new URL('/art/home_spectate.webp', import.meta.url);
const flyImage = new URL('/art/home_fly.webp', import.meta.url);
const officiateImage = new URL('/art/home_officiate.webp', import.meta.url);

export default function LaunchHome() {
  const [attendee] = useAttendee();
  const [launch] = useLaunch();
  const [officers] = useOfficers();

  if (!attendee) return <Waiver />;
  if (!launch) return <Loading wat='Launch' />;

  function launchUrl(suffix: string) {
    if (!launch?.id) throw Error('No launch id'); // Should never happen
    return `/launches/${launch.id}/${suffix}`;
  }

  const bgStyle = {
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right',
    backgroundSize: 'contain',
  };

  const isOfficer = officers?.[attendee.id];

  if (!attendee.name) {
    return (
      <>
        <p>
          Please start by telling us your name. This helps us keep the launch
          safe and fun!
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
          <FCLinkButton
            className='btn-sm text-nowrap my-auto ms-2'
            to={`/launches/${launch.id}/edit`}
          >
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
        <Card style={{ backgroundImage: `url(${spectateImage})`, ...bgStyle }}>
          <Card.Title className='px-2 py-1'>Spectate</Card.Title>
          <Card.Body>
            {attendee?.name ? (
              <>
                <FCLink to={launchUrl('lco')}>Launch Control Ride Along</FCLink>
                <FCLink to={launchUrl('users')}>View Attendees</FCLink>
                <FCLink disabled to={launchUrl('/report')}>
                  View Launch Stats
                </FCLink>
              </>
            ) : (
              <>
                <p>
                  Please start by telling us your name. This helps us keep the
                  launch safe and fun!
                </p>
                <ProfileName
                  attendeeFields={{ launchId: launch.id, userId: attendee.id }}
                />
              </>
            )}
          </Card.Body>
        </Card>

        <Card style={{ backgroundImage: `url(${flyImage})`, ...bgStyle }}>
          <Card.Title className='px-2 py-1'>Fly</Card.Title>
          <Card.Body>
            <FCLink to={launchUrl('cards/new')}>Fill Out A Flight Card</FCLink>
            <FCLink to={launchUrl('cards')}>My Flight Cards</FCLink>
            <FCLink to={launchUrl('users?filter=officers')}>
              Find a Launch Officer
            </FCLink>
          </Card.Body>
        </Card>

        <Card style={{ backgroundImage: `url(${officiateImage})`, ...bgStyle }}>
          <Card.Title className='px-2 py-1'>Officiate</Card.Title>
          <Card.Body>
            <FCLink disabled={!isOfficer} to={launchUrl('lco')}>
              Launch Control Duty
            </FCLink>
            <FCLink disabled={!isOfficer} to={launchUrl('rso')}>
              Range Safety Duty
            </FCLink>
            <FCLink disabled to={launchUrl('rso')}>
              Flight Card Helper
            </FCLink>
            <FCLink disabled to={launchUrl('rso')}>
              Verify Attendees
            </FCLink>
          </Card.Body>
        </Card>
      </div>
    </>
  );
}
