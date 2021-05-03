import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { db } from '../firebase';
import { useCurrentUser } from './App';
import { Loading } from './util';

export default function Launches() {
  const history = useHistory();
  const launches = db.launches.useValue();
  const [currentUser] = useCurrentUser();

  if (!currentUser) return <Loading wat='User (Launches)' />;
  if (!launches) return <Loading wat='Launches' />;

  return <>
    <p>The following launches are currently available for checkin:</p>
    <div className='deck'>
      {
        Object.entries(launches).map(([launchId, l]) => {
          async function onClick() {
            sessionStorage.setItem('currentLaunchId', launchId);
            dispatchEvent(new Event('storage')); // storage events don't happen for same-window

            history.push(`/launches/${launchId}`);
          }

          return <Card key={launchId}>
            <Card.Body>
              <Card.Title >{l.name}</Card.Title>
              <Card.Text>
                Location: {l.location}
                <br />
                Host: {l.host}
              </Card.Text>
              <Button onClick={onClick}>Check in to {l.name}</Button>
            </Card.Body>
          </Card>;
        })
      }
    </div>
  </>;
}
