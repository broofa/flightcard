import React, { HTMLAttributes } from 'react';
import { useNavigate } from 'react-router-dom';
import ColorChits from '../Cards/ColorChits';
import { Loading } from '../common/util';
import { useAttendees } from '../contexts/rthooks';
import '/components/Launch/LaunchCard.scss';
import { iAttendee, iCard } from '/types';
import { totalImpulseClass } from '/util/motor-util';

export function LaunchCard({
  card,
}: {
  card: iCard;
  attendee?: iAttendee;
} & HTMLAttributes<HTMLDivElement>) {
  const motors = Object.values(card?.motors ?? {});

  const navigate = useNavigate();
  const [attendees] = useAttendees();

  if (!attendees) return <Loading wat='Attendees' />;

  const user = attendees[card.userId ?? ''];

  const impulseClass = totalImpulseClass(motors);
  const warnings = [];
  const isVerified = user?.cert?.verifiedTime ? true : false;
  const certLevel = user.cert?.level ?? 0;

  if (!impulseClass) {
    warnings.push(
      'Unknown rocket impulse (Is flier certified for this flight?)'
    );
  } else if (impulseClass > 'L' && certLevel < 3) {
    warnings.push(`Flier is not L3 certified`);
  } else if (impulseClass > 'I' && certLevel < 2) {
    warnings.push(`Flier is not L2 certified`);
  } else if (impulseClass > 'H' && certLevel < 1) {
    warnings.push(`Flier is not L1 certified`);
  }

  if (!impulseClass || (impulseClass > 'H' && !isVerified)) {
    warnings.push('Verify flier certification');
  }

  return (
    <div
      className='d-flex flex-grow-1 launch-card rounded border border-dark m-2 ps-2 cursor-pointer'
      onClick={() => navigate(`/launches/${card.launchId}/cards/${card.id}`)}
    >
      <div className='flex-grow-1  align-self-center'>
        {user.name} &mdash; "{card?.rocket?.name ?? '(unnamed)'}"
        {warnings.length > 0 ? (
          <div className='text-danger'>
            {'\u{26A0}'} {warnings.join(', ')}
          </div>
        ) : null}
      </div>

      {card.rocket?.color ? (
        <div
          className='d-flex flex-column flex-grow-0 flex-shrink-0'
          style={{ flexBasis: '10px' }}
        >
          <ColorChits className='flex-grow-1' colors={card.rocket?.color} />
        </div>
      ) : (
        <div className='flex-grow-0 flex-shrink-0' />
      )}

      <div
        className='flex-grow-0 text-center fs-3 align-self-stretch'
        style={{ flexBasis: '2em', backgroundColor: 'rgba(0, 0, 0, .15)' }}
      >
        {impulseClass ?? '-'}
      </div>
    </div>
  );
}
