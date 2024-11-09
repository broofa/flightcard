import React from 'react';
import { Card, CardProps } from 'react-bootstrap';
import { iLaunch } from '../../types';
import { LinkButton } from '/components/common/util';

function dateString(ts: string) {
  return new Date(`${ts}T00:00:00`).toLocaleDateString();
}

export default function EventCard({
  launch,
  ...props
}: { launch: iLaunch } & CardProps) {
  return (
    <Card key={launch.id} {...props}>
      <Card.Body>
        <Card.Title>{launch.name}</Card.Title>
        <div>
          Dates: {dateString(launch.startDate)} - {dateString(launch.endDate)}
        </div>
        <div>Location: {launch.location}</div>
        <div>Host: {launch.host}</div>
        <LinkButton className='mt-2' to={`/launches/${launch.id}`}>
          Check into {launch.name}
        </LinkButton>
      </Card.Body>
    </Card>
  );
}
