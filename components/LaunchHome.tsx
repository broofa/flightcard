import React, { useContext } from 'react';
import { Alert, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import simplur from 'simplur';
import { AppContext } from './App/App';
import { AttendeesLink, Loading, ProfileLink } from '/components/common/util';
import Icon from '/components/common/Icon';
import { AttendeeInfo } from '/components/UserList';
import { Waiver } from '/components/Waiver';

export default function LaunchHome() {
  const { launch, attendees, attendee, officers } = useContext(AppContext);

  if (!attendee) return <Waiver />;
  if (!launch) return <Loading wat='Launch' />;
  if (!attendees) return <Loading wat='Attendees' />;

  const role = Object.values(attendees);
  const lcos = role.filter(a => a.role == 'lco');
  const rsos = role.filter(a => a.role == 'rso');
  const cert = attendee?.cert;

  return (
    <>
      <div className='deck'>
        <Card>
          <Card.Body>
            <Card.Title>Fliers</Card.Title>
            <Card.Text>
              Flight cards, launch history, and more
            </Card.Text>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <Card.Title>Spectators</Card.Title>
            <Card.Text>
              See what's flying right now, and what's coming up
            </Card.Text>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <Card.Title>Club Officers</Card.Title>
            <Card.Text>Launch Control, Range Safety, and other launch management tools</Card.Text>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <Card.Title>Buzz</Card.Title>
            <Card.Text>Stats, contests, social media</Card.Text>
          </Card.Body>
        </Card>
      </div>

      <div className='d-flex'>
        <h2 className='flex-grow-1'>Welcome to {launch.name}</h2>
        {officers?.[attendee.id] ? (
          <Link to={`/launches/${launch.id}/edit`}>
            <Icon name='pencil-fill' />
          </Link>
        ) : null}
      </div>

      {cert?.level == null || !cert?.verifiedTime ? (
        <Alert variant='warning'>
          Please indicate your certification level on the{' '}
          <ProfileLink launchId={launch.id} />.
        </Alert>
      ) : null}

      <p>
        <strong>{simplur`${role.length} [person has|people have] checked in`}</strong>
        . See the <AttendeesLink launchId={launch.id} /> for details.
      </p>

      <div className='mb-0'>
        <strong>{simplur`${[rsos.length]}RSO[|s]`} on duty: </strong>
        {rsos.length ? (
          rsos.map(u => (
            <AttendeeInfo
              key={u.id}
              className='my-2 ms-4 p-1 bg-light'
              attendee={u}
            />
          ))
        ) : (
          <span className='text-warning fst-italic'>None at this time</span>
        )}
      </div>

      <div className='my-2'>
        Visit the <Link to={`/launches/${launch.id}/rso`}>RSO Page</Link> for
        rockets being safety reviewed.
      </div>

      <div className='mb-0'>
        <strong>{simplur`${[lcos.length]}LCO[|s]`} on duty: </strong>
        {lcos.length ? (
          lcos.map(u => (
            <AttendeeInfo
              key={u.id}
              className='my-2 ms-4 p-1 bg-light'
              attendee={u}
            />
          ))
        ) : (
          <span className='text-warning fst-italic'>None at this time</span>
        )}
      </div>

      <div>
        Visit the <Link to={`/launches/${launch.id}/lco`}>LCO page</Link> for
        flight range details.
      </div>
    </>
  );
}
