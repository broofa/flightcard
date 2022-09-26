import React, { HTMLAttributes, useMemo } from 'react';
import { useMatch } from 'react-router-dom';
import { useIsOfficer } from '../contexts/OfficersContext';
import { useCurrentAttendee, usePads, useUserUnits } from '../contexts/rthooks';
import UnitsPref from '../Profile/UnitsPref';
import { rtuiFromPath } from '../rtui/RTUI';
import { cn, Loading, sig } from '/components/common/util';
import { useRTValue } from '/rt';
import { MKS, unitConvert } from '/util/units';

import simplur from 'simplur';
import {
  AttendeeFields,
  ATTENDEE_PATH,
  CardFields,
  CARD_PATH,
  ROCKET_PATH,
} from '/rt/rtconstants';
import { CardStatus, iAttendee, iCard } from '/types';

function FormSection({
  className,
  children,
  ...props
}: { className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className, `text-muted h2 mt-3`)} {...props}>
      {children}
    </div>
  );
}

export default function CardSummary() {
  const [userUnits = MKS] = useUserUnits();
  const [attendee] = useCurrentAttendee();
  const [pads] = usePads();
  const match = useMatch('launches/:launchId/cards/:cardId/summary');
  const isOfficer = useIsOfficer();

  const cardFields: CardFields = {
    launchId: match?.params.launchId ?? '',
    cardId: match?.params.cardId ?? '',
  };
  const [card] = useRTValue<iCard>(CARD_PATH.with(cardFields));
  const cardPath = CARD_PATH.with(cardFields);

  const flierFields: AttendeeFields = {
    launchId: match?.params.launchId ?? '',
    userId: card?.userId ?? '',
  };
  const flierPath = ATTENDEE_PATH.with(flierFields);
  const [flier] = useRTValue<iAttendee>(flierPath);

  const colorsPath = ROCKET_PATH.append('color').with(cardFields);
  const [colors] = useRTValue<string>(colorsPath);

  const rtui = useMemo(() => {
    return rtuiFromPath(cardPath, userUnits);
  }, [cardPath, userUnits]);

  if (!card) return <Loading wat='Card' />;
  if (!attendee) return <Loading wat='Current user' />;
  if (!pads) return <Loading wat='Pads' />;

  const isDraft = card?.status === CardStatus.DRAFT;

  return (
    <>
      {/* Units Pref UI */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: '4em',
          zIndex: 999,
          backgroundColor: '#fff',
        }}
      >
        <UnitsPref authId={attendee.id} className='mt-1 me-1' />
        <div style={{ fontSize: '9pt', textAlign: 'center', color: 'gray' }}>
          Units
        </div>
      </div>

      <div>
        <h3>
          {flier?.name ?? '(mystery flier!)'}
          &mdash; {card.rocket?.name} ({card.rocket?.manufacturer})
        </h3>
        {flier?.photoURL ? (
          <img
            className='me-3'
            src={flier?.photoURL}
            style={{ maxWidth: '3em', float: 'left' }}
          />
        ) : null}
        <div
          className='d-grid'
          style={{ gridTemplateColumns: 'max-content 1fr', gap: '0 1em' }}
        >
          {card.rocket?.diameter ? (
            <>
              <div className='text-muted'>Diameter</div>
              <div>
                {sig(
                  unitConvert(
                    card.rocket.diameter,
                    MKS.length,
                    userUnits.lengthSmall
                  )
                )}{' '}
                {userUnits.lengthSmall}
              </div>
            </>
          ) : null}

          {card.rocket?.length ? (
            <>
              <div className='text-muted'>Length</div>
              <div>
                {sig(
                  unitConvert(card.rocket.length, MKS.length, userUnits.length)
                )}{' '}
                {userUnits.length}
              </div>
            </>
          ) : null}

          {card.rocket?.mass ? (
            <>
              <div className='text-muted'>Mass</div>
              <div>
                {sig(unitConvert(card.rocket.mass, MKS.mass, userUnits.mass))}{' '}
                {userUnits.mass}
              </div>
            </>
          ) : null}

          {card.rocket?.color ? (
            <>
              <div className='text-muted'>Color(s)</div>
              <div>{card.rocket.color}</div>
            </>
          ) : null}

          <div>{simplur`${[card?.motors?.length ?? 0]}Motor[s|]`}</div>
          {card.motors
            ? Object.entries(card.motors).map(([motorId, motor]) => {
                console.log(motorId, motor);
                return <div key={motorId}>{motor.name}</div>;
              })
            : null}
        </div>
      </div>
    </>
  );
}
