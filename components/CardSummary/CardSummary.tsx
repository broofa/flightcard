import React from 'react';
import { useMatch } from 'react-router-dom';
import { Loading, sig } from '/components/common/util';
import {
  useCurrentAttendee,
  useUserUnits,
} from '/components/contexts/rt_hooks';
import { useRTValue } from '/rt';
import { MKS, unitConvert } from '/util/units';

import simplur from 'simplur';
import {
  ATTENDEE_PATH,
  AttendeeFields,
  CARD_PATH,
  CardFields,
} from '/rt/rtconstants';
import { iAttendee, iCard, iMotor, iRocket } from '/types';

import { Alert } from 'react-bootstrap';
import { arrayGroup } from '../../util/array-util';
import styles from './CardSummary.module.scss';
import { QuickUnits } from '/components/CardSummary/QuickUnits';
import { AttendeeInfo } from '/components/common/AttendeeInfo/AttendeeInfo';
import ColorChits from '/components/common/ColorChits';
import { FCLinkButton } from '/components/common/FCLinkButton';
import Icon from '/components/common/Icon';

function RocketDimensions({ rocket }: { rocket?: iRocket }) {
  const [userUnits = MKS] = useUserUnits();

  if (!rocket) return null;

  let { diameter, length } = rocket;
  const text = [];
  if (diameter != null) {
    if (length != null) {
      length = unitConvert(length, MKS.length, userUnits.length);
      text.push(`${sig(length)} ${userUnits.length}`);
    }
    diameter = unitConvert(diameter, MKS.length, userUnits.lengthSmall);
    text.push(`${sig(diameter)} ${userUnits.lengthSmall}`);
  }
  return <span>{text.join(' x ')}</span>;
}

function MotorsList({ motors }: { motors: iMotor[] }) {
  const byStage = arrayGroup(motors, motor => motor.stage ?? 0);
}

export default function CardSummary() {
  const [userUnits = MKS] = useUserUnits();
  const [attendee] = useCurrentAttendee();
  const match = useMatch('launches/:launchId/cards/:cardId/summary');

  const cardFields: CardFields = {
    launchId: match?.params.launchId ?? '',
    cardId: match?.params.cardId ?? '',
  };
  const [card] = useRTValue<iCard>(CARD_PATH.with(cardFields));

  const flierFields: AttendeeFields = {
    launchId: match?.params.launchId ?? '',
    userId: card?.userId ?? '',
  };
  const flierPath = ATTENDEE_PATH.with(flierFields);
  const [flier] = useRTValue<iAttendee>(flierPath);

  if (!card) return <Loading wat='Card' />;
  if (!attendee) return <Loading wat='Current user' />;
  if (!flier) {
    return <Loading wat='Flier' />;
  }

  const specials = [];
  if (card.firstFlight) {
    specials.push(
      <div key={specials.length} className={styles.special}>
        This is a <strong>First Flight</strong>
      </div>
    );
  }
  if (card.headsUp) {
    specials.push(
      <div key={specials.length} className={styles.special}>
        This is a <strong>Heads Up</strong> flight
      </div>
    );
  }

  if (card.notes) {
    if (specials.length > 0) specials.push(<hr />);
    specials.push(
      <div key={specials.length} className={styles.notes}>
        {card.notes}
      </div>
    );
  }

  return (
    <>
      <FCLinkButton className='btn-sm text-nowrap my-auto ms-2' to='..'>
        <Icon name='pencil-fill' /> Edit
      </FCLinkButton>

      <QuickUnits />

      <h2>
        <AttendeeInfo
          className='me-3 p-2 bg-light border border-dark rounded'
          attendee={flier}
        />
      </h2>

      <div>
        <h3>
          <span className={styles.name}>
            {card.rocket?.name ? `"${card.rocket.name}"` : '(unnamed )'}
          </span>{' '}
          <span className={styles.manufacturer}>
            {card.rocket?.manufacturer
              ? `(${card.rocket?.manufacturer} kit)`
              : null}
          </span>
        </h3>

        <div
          className='d-grid'
          style={{ gridTemplateColumns: 'max-content 1fr', gap: '.5em 1em' }}
        >
          <div className='text-muted'>Length x Diam.:</div>
          <RocketDimensions rocket={card.rocket} />

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
              <div className='d-flex'>
                <span className='flex-grow-0'>{card.rocket?.color}</span>
                <div
                  className='d-flex flex-row ms-2 my-1'
                  style={{ flexBasis: '3em' }}
                >
                  <ColorChits
                    className='flex-grow-1'
                    colors={card.rocket?.color}
                  />
                </div>
              </div>
            </>
          ) : null}

          <div className='text-muted'>{simplur`${[
            card?.motors?.length ?? 0,
          ]}Motor[s|]`}</div>
          {card.motors
            ? Object.entries(card.motors).map(([motorId, motor]) => (
                <div key={motorId}>{motor.name}</div>
              ))
            : null}
        </div>
      </div>
      {specials.length ? (
        <>
          <Alert className='mt-2' variant='warning'>
            {specials}
          </Alert>
        </>
      ) : null}
    </>
  );
}
