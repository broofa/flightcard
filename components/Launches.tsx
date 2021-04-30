import React, { useContext } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { db } from '../firebase';
import { appContext } from './App';
import { Loading } from './util';

export default function Launches() {
  const history = useHistory();
  const launches = db.launches.useValue();
  const { currentUser } = useContext(appContext);

  if (!currentUser) return <Loading wat='User (Launches)' />;
  if (!launches) return <Loading wat='Launches' />;

  return <>
    <p>The following launches are currently available for checkin:</p>
    <div className='deck'>
      {
        Object.entries(launches).map(([launchId, l]) => {
          async function onClick() {
            if (currentUser) {
              await db.user.update(currentUser.id, { currentLaunchId: launchId });
            }

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
