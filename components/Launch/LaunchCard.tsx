import React from 'react';
import { Link } from 'react-router-dom';
import ColorChits from '../CardEditor/ColorChits';
import { AttendeeInfo } from './UserList';
import '/components/Launch/LaunchCard.scss';
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

  if (isNaN(impulse)) {
    return undefined;
  }

  if (impulse === 0) {
    return '-';
  }

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
  const motors = Object.values(card?.motors ?? {});
  console.log(card.rocket?.color);
  return (
    <div className='d-flex rounded border border-dark'>
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
        <div className='flex-grow-1'>
          <div>
            {card.rocket?.name ? (
              `"${card.rocket.name}"`
            ) : (
              <em>Unnamed rocket</em>
            )}
          </div>
          {motors?.length ? (
            <div className=''>
              <span className='text-muted'>
                {motors.map(m => m.name ?? '(?)').join(', ')}
              </span>
            </div>
          ) : null}
        </div>
      </Link>
      {card.rocket?.color ? (
          <div className='d-flex flex-column flex-grow-0 flex-shrink-0' style={{ flexBasis: '10px' }}>
            <ColorChits className='flex-grow-1' colors={card.rocket?.color} />
          </div>
        ) : null}

      {motors ? (
        <div className='flex-grow-0 text-center fs-1 px-3 bg-light rounded' style={{width: '2em'}}>
          {totalImpulseClass(motors)}
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}
