import React, { useContext } from 'react';
import { Button, Card } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { iLaunch } from '../types';
import { AppContext } from './App';
import { Loading, tProps } from './common/util';

function dateString(ts) {
  return new Date(`${ts}T00:00:00`).toLocaleDateString();
}

function EventCard({ launch, ...props } : {launch : iLaunch} & tProps) {
  return <Card key={launch.id} {...props}>
    <Card.Body>
      <Card.Title >{launch.name}</Card.Title>
      <div>Dates: {dateString(launch.startDate)} - {dateString(launch.endDate)}</div>
      <div>Location: {launch.location}</div>
      <div>Host: {launch.host}</div>
      <LinkContainer className='mt-2' to={`/launches/${launch.id}`}>
        <Button>Check into {launch.name}</Button>
      </LinkContainer>
    </Card.Body>
  </Card>;
}

export default function Launches() {
  const { launches, currentUser } = useContext(AppContext);

  if (!currentUser) return <Loading wat='User (Launches)' />;
  if (!launches) return <Loading wat='Launches' />;

  return <>
    <h2>Current and Upcoming Launches</h2>
    <div className='deck'>
      {
      Object.values(launches)
        .filter(l => Date.parse(`${l.endDate}T23:59:59`) >= Date.now())
        .map(l => <EventCard key={l.id} launch={l} />)
      }
    </div>

    <h2>Past Launches</h2>
    <div className='deck'>
      {
        Object.values(launches)
          .filter(l => Date.parse(`${l.endDate}T23:59:59`) < Date.now())
          .map(l => <EventCard key={l.id} launch={l} />)
      }
    </div>
  </>;
}
