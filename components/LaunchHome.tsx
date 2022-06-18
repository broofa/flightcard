import React, { useContext } from 'react';
import { Alert, Card, Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { Link } from 'react-router-dom';
import simplur from 'simplur';
import { AppContext } from './App/App';
import Icon from '/components/common/Icon';
import { AttendeesLink, Loading, ProfileLink } from '/components/common/util';
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

  function launchUrl(suffix: string) {
    if (!launch?.id) throw Error('No launch id'); // Should never happen
    return `/launches/${launch.id}/${suffix}`;
  }

  return (
    <>
      {!attendee.name || cert?.level == null || !cert?.verifiedTime ? (
        <Alert variant='warning'>
          Please provide your name and certification level on your{' '}
          <ProfileLink launchId={launch.id} />.
        </Alert>
      ) : null}

      <div className='deck'>
        <Card>
          <Card.Body>
            <Card.Title>Spectators</Card.Title>
            <Card.Text>
              <NavLink to={launchUrl('lco')}>
                Tune Into Launch Control
              </NavLink>
            </Card.Text>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <Card.Title>Fliers</Card.Title>
            <Card.Text>
              <Nav.Link href={launchUrl('cards/new')}>
                Fill Out A Flight Card
              </Nav.Link>
              <Nav.Link href={launchUrl('cards')}>
                My Flight Cards
              </Nav.Link>
              <Nav.Link href={launchUrl('users?filter=officers')}>
                Find a Launch Officer
              </Nav.Link>
            </Card.Text>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <Card.Title>Club Officers</Card.Title>
            <Card.Text>
              <Nav>
                <Nav.Item>
                  <Nav.Link href={launchUrl('lco')}>
                    Report For Duty (Launch Control)
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link href={launchUrl('rso')}>
                    Report For Duty (Range Safety)
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Text>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <Card.Title>Information</Card.Title>
            <Card.Text>Stats, contests, social media</Card.Text>
            <Nav.Link href={launchUrl('users')}>View Attendees</Nav.Link>
            <Nav.Link href={launchUrl('/report')}>View Launch Stats</Nav.Link>
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
