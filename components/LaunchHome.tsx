import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import simplur from 'simplur';
import { AppContext } from './App';
import { AttendeeInfo } from './UserList';
import { Loading } from './util';

export default function LaunchHome() {
  const { launch, attendees, attendee } = useContext(AppContext);

  if (!launch) return <Loading wat='Launch' />;
  if (!attendees) return <Loading wat='Attendees' />;

  const role = Object.values(attendees);
  const lcos = role.filter(a => a.role == 'lco');
  const rsos = role.filter(a => a.role == 'rso');
  const cert = attendee?.cert;
  const profileLink = <Link to={`/launches/${launch.id}/profile`}>Profile Page</Link>;
  const attendeesLink = <Link to={`/launches/${launch.id}/users`}>Attendee Page</Link>;

  return <>
    <h2>Welcome to {launch.name}</h2>
    <p>
      <strong>{simplur`${role.length} [person has|people have] checked in`}</strong>.
      See the {attendeesLink} for details.
    </p>

    <details className={'mb-3 p-1 rounded border border-warning'}>
      <summary className={`${!cert?.verifiedTime ? 'text-warning' : ''}`}>
      {
      cert
        ? (
            cert?.level >= 1
              ? (
                  cert.verifiedTime
                    ? <strong>Certification verified, thank you!</strong>
                    : <strong>Certification provided, but not yet verified.</strong>
                )
              : <strong></strong>
          )
        : <strong>Please provide your certification level.</strong>
      }
      {cert?.verifiedTime ? null : '(See instructions ...)'}
      </summary>

      <ol>
        <li>Go to your {profileLink} and choose your certification level</li>
        <li>[<em>High power only</em>] Present your card to one of the launch officers shown on the {attendeesLink} for verification.</li>
      </ol>
    </details>

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
