import React, { useContext } from 'react';
import { Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import simplur from 'simplur';
import { AppContext } from './App';
import { AttendeesLink, Loading, ProfileLink } from './common/util';
import Icon from './Icon';
import { AttendeeInfo } from './UserList';

export default function LaunchHome() {
  const { launch, attendees, attendee, officers } = useContext(AppContext);

  if (!launch) return <Loading wat='Launch' />;
  if (!attendees) return <Loading wat='Attendees' />;
  if (!attendee) return <Loading wat='Attendee' />;

  const role = Object.values(attendees);
  const lcos = role.filter(a => a.role == 'lco');
  const rsos = role.filter(a => a.role == 'rso');
  const cert = attendee?.cert;

  return <>
    <div className='d-flex'>
      <h2 className='flex-grow-1'>Welcome to {launch.name}</h2>

      {
        officers?.[attendee.id]
          ? <Link to={`/launches/${launch.id}/edit`}><Icon name='pencil-fill' /></Link>
          : null
      }
    </div>

    {
      (cert?.level == null || !cert?.verifiedTime)
        ? <Alert variant='warning'>Please indicate your certification level on the <ProfileLink launchId={launch.id} />.</Alert>
        : null
    }

    <p>
      <strong>{simplur`${role.length} [person has|people have] checked in`}</strong>.
      See the <AttendeesLink launchId={launch.id} /> for details.
    </p>

    <div className='mb-0'>
    <strong>{simplur`${[rsos.length]}RSO[|s]`} on duty: </strong>
      {
        rsos.length
          ? rsos.map(u => <AttendeeInfo key={u.id} className='my-2 ms-4 p-1 bg-light' attendee={u} />)
          : <span className='text-warning fst-italic'>None at this time</span>
      }
    </div>

    <div className='my-2'>
      Visit the <Link to={`/launches/${launch.id}/rso`}>RSO Page</Link> for rockets being safety reviewed.
    </div>

    <div className='mb-0'>
      <strong>{simplur`${[lcos.length]}LCO[|s]`} on duty: </strong>
      {
        lcos.length
          ? lcos.map(u => <AttendeeInfo key={u.id} className='my-2 ms-4 p-1 bg-light' attendee={u} />)
          : <span className='text-warning fst-italic'>None at this time</span>
      }
    </div>

    <div>
      Visit the <Link to={`/launches/${launch.id}/lco`}>LCO page</Link> for flight range details.
    </div>
  </>;
}
