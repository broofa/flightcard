import type { HTMLAttributes } from 'react';
import { useNavigate } from 'react-router-dom';
import '/components/Launch/LaunchCard.scss';
import ColorChits from '/components/common/ColorChits';
import { Warning } from '/components/common/Warning';
import { Loading } from '/components/common/util';
import { useAttendees } from '/components/contexts/rt_hooks';
import type { iCard } from '/types';
import { getCertLevel, getCertVerified } from '/util/cert-util';
import { totalImpulseClass } from '/util/MotorDB';

export function LaunchCard({
  card,
  summary,
}: {
  card: iCard;
  summary?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  const motors = Object.values(card?.motors ?? {});

  const navigate = useNavigate();
  const [attendees] = useAttendees();

  if (!attendees) return <Loading wat='Attendees' />;

  const user = attendees[card.userId ?? ''];

  const impulseClass = totalImpulseClass(motors);
  const warnings = [];
  const isVerified = getCertVerified(user);
  const certLevel = getCertLevel(user, true);

  if (isVerified) {
    if (!impulseClass) {
      warnings.push(
        'Unknown rocket impulse (Is flier certified for this flight?)'
      );
    } else if (impulseClass > 'L' && certLevel < 3) {
      warnings.push('Flier not L3 certified');
    } else if (impulseClass > 'I' && certLevel < 2) {
      warnings.push('Flier not L2 certified');
    } else if (impulseClass > 'H' && certLevel < 1) {
      warnings.push('Flier not L1 certified');
    }
  } else {
    if (!impulseClass || (impulseClass > 'H' && !isVerified)) {
      warnings.push('Verify flier cert');
    }
  }

  let launchcardUrl = `/launches/${card.launchId}/cards/${card.id}`;
  if (summary) launchcardUrl += '/summary';

  return (
    <div
      className='d-flex flex-grow-1 launch-card rounded border border-dark m-2 ps-2 cursor-pointer'
      onClick={() => navigate(launchcardUrl)}
    >
      <div className='flex-grow-1  align-self-center'>
        {user.name} &mdash; "{card?.rocket?.name ?? '(unnamed)'}"
        {warnings.length ? (
          <div>
            {warnings.map((w) => (
              <Warning key={w}>{w}</Warning>
            ))}
          </div>
        ) : null}
      </div>

      {card.rocket?.color ? (
        <div
          className='d-flex flex-column flex-grow-0 flex-shrink-0  border-start border-light'
          style={{ flexBasis: '20px' }}
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
