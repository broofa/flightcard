import React, { useContext } from 'react';
import { Alert, Card } from 'react-bootstrap';
import { AppContext } from './App/App';
import { FCLink } from './common/FCLink';
import { FCLinkButton } from './common/FCLinkButton';
import Icon from '/components/common/Icon';
import { Loading, ProfileLink } from '/components/common/util';
import { Waiver } from '/components/Waiver';

const spectateImage = new URL('/art/home_spectate.webp', import.meta.url);
const flyImage = new URL('/art/home_fly.webp', import.meta.url);
const officiateImage = new URL('/art/home_officiate.webp', import.meta.url);

export default function LaunchHome() {
  const { launch, attendees, attendee, officers } = useContext(AppContext);

  if (!attendee) return <Waiver />;
  if (!launch) return <Loading wat='Launch' />;
  if (!attendees) return <Loading wat='Attendees' />;

  const cert = attendee?.cert;

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

  return (
    <>
      <div className='d-flex mb-2'>
        <h2 className='flex-grow-1'>Welcome to {launch.name}</h2>
        {isOfficer ? (
          <FCLinkButton
            className='btn-sm text-nowrap my-2 ms-2'
            to={`/launches/${launch.id}/edit`}
          >
            Edit <Icon name='pencil-fill' />
          </FCLinkButton>
        ) : null}
      </div>

      {!attendee.name || cert?.level == null || !cert?.verifiedTime ? (
        <Alert variant='warning'>
          Please provide your name and certification level on your{' '}
          <ProfileLink launchId={launch.id} />.
        </Alert>
      ) : null}

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
            <FCLink to={launchUrl('lco')}>Tune Into Launch Control</FCLink>
            <FCLink to={launchUrl('users')}>View Attendees</FCLink>
            <FCLink to={launchUrl('/report')}>View Launch Stats</FCLink>
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
            <FCLink disabled={!isOfficer} to={launchUrl('rso')}>Range Safety Duty</FCLink>
            <FCLink disabled={!isOfficer} to={launchUrl('rso')}>Registration Duty</FCLink>
          </Card.Body>
        </Card>
      </div>
    </>
  );
}
