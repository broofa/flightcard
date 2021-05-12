import React, { useContext } from 'react';
import { Button, Card } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { AppContext } from './App';
import { Loading } from './util';

export default function Launches() {
  const { launches, currentUser } = useContext(AppContext);

  if (!currentUser) return <Loading wat='User (Launches)' />;
  if (!launches) return <Loading wat='Launches' />;

  return <>
    <p>The following launches are currently available for checkin:</p>
    <div className='deck'>
      {
        Object.entries(launches).map(([launchId, l]) => {
          return <Card key={launchId}>
            <Card.Body>
              <Card.Title >{l.name}</Card.Title>
              <Card.Text>
                Location: {l.location}
                <br />
                Host: {l.host}
              </Card.Text>
              <LinkContainer to={`/launches/${launchId}`}>
                <Button>Check into {l.name}</Button>
              </LinkContainer>
            </Card.Body>
          </Card>;
        })
      }
    </div>
  </>;
}
