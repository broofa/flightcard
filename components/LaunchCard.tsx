import React from 'react';
import { Link } from 'react-router-dom';
import simplur from 'simplur';
import '/components/LaunchCard.scss';
import { AttendeeInfo } from '/components/UserList';
import { iAttendee, iCard } from '/types';

const IMPULSE_CLASSES = [
  'Micro',
  '1/4A',
  '1/2A',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  'AA',
  'AB',
  'AC',
  'AD',
  'AE',
  'AF',
  'AG',
  'AH',
  'AI',
  'AJ',
];

function totalImpulseClass(
  motors: Array<{ impulse?: number; totImpulseNs?: number }>
) {
  if (!motors) return undefined;
  const impulse = Object.entries(motors).reduce(
    (acc: number, [, m]) => acc + (m.impulse ?? m.totImpulseNs ?? NaN),
    0
  );
  console.log('MOTORS IMPULSE', impulse, motors);
  return isNaN(impulse)
    ? undefined
    : IMPULSE_CLASSES.find((v, i) => impulse < 0.3125 * 2 ** i);
}

export function LaunchCard({
  card,
  attendee,
}: {
  card: iCard;
  attendee?: iAttendee;
}) {
  return (
    <div className='d-flex rounded border border-dark '>
      <Link
        to={`/launches/${card.launchId}/cards/${card.id}`}
        className='launch-card text-center flex-grow-1 d-flex flex-column p-1 cursor-pointer'
      >
        {attendee ? (
          <AttendeeInfo
            className='flex-grow-0 text-left me-1 fw-bold border-bottom pb-1 mb-1'
            hidePhoto
            attendee={attendee}
          />
        ) : null}
        <div>
          {card.rocket?.name ? (
            `"${card.rocket.name}"`
          ) : (
            <em>Unnamed rocket</em>
          )}
        </div>
        {card.motors?.length ? (
          <div className=''>
            {simplur`${[card.motors?.length]} motor[|s]`}:{' '}
            <strong>{card.motors.map(m => m.name ?? '(?)').join(', ')}</strong>
          </div>
        ) : null}
      </Link>

      {card.motors ? (
        <div className='flex-grow-0 fs-1 px-3 bg-light rounded'>
          {totalImpulseClass(card.motors)}
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}
