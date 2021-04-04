import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { iLaunch } from '../db';
import { Card, Button } from 'react-bootstrap';

export default function Launches() : React.ReactElement {
  const launches = useLiveQuery(() => db.launches.toArray());

  if (!launches) return <p>Loading</p>;

  return <>
    <p>The following launches are currently available for checkin:</p>
    <div className="deck">
      {launches.map((l : iLaunch) => <Card key={l.id}>
        <Card.Body>
          <Card.Title >{l.name}</Card.Title>
          <Card.Text>
            Location: {l.location}
            <br />
            Host: {l.host}
          </Card.Text>
          <Button href={`launches/${l.id}`}>Check in to {l.name}</Button>
        </Card.Body>
      </Card>)}
    </div>
  </>;
}
