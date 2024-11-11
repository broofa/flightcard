import { useMatch } from 'react-router-dom';
import { Loading, sig } from '/components/common/util';
import {
  useAttendee,
  useCard,
  useUserUnits,
} from '/components/contexts/rt_hooks';
import { MKS, unitConvert } from '/util/units';

import simplur from 'simplur';
import type { iMotor, iRocket } from '/types';

import { Alert } from 'react-bootstrap';
import { AttendeeInfo } from '/components/common/AttendeeInfo/AttendeeInfo';
import ColorChits from '/components/common/ColorChits';
import { FCLinkButton } from '/components/common/FCLinkButton';
import Icon from '/components/common/Icon';
import { arrayGroup } from '../../util/array-util';
import { QuickUnits } from '../common/QuickUnits';
import styles from './CardSummary.module.scss';

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

function MotorsList({ motors }: { motors?: Record<string, iMotor> }) {
  if (!motors) return '(no motors)';

  const byStage = arrayGroup(
    Object.values(motors),
    (motor) => motor.stage ?? 0
  );
  const parts = [];
  const stages = [...byStage.keys()].sort();
  for (const stage of stages) {
    const motors = byStage.get(stage);
    if (!motors) continue;
    parts.push(
      <div key={stage}>
        {stages.length === 1 && stages[0] === 1 ? (
          <strong className='me-2'>Stage {stage}:</strong>
        ) : null}
        {motors.map((motor, i) => (
          <span key={motor.id}>
            {i > 0 ? ', ' : ''}
            {motor.name}
          </span>
        ))}
      </div>
    );
  }

  return <div>{parts}</div>;
}

export default function CardSummary() {
  const [userUnits = MKS] = useUserUnits();
  const match = useMatch('launches/:launchId/cards/:cardId/summary');

  const launchId = match?.params.launchId ?? '';
  const cardId = match?.params.cardId ?? '';

  const [card] = useCard(cardId);
  const [flier] = useAttendee(card?.userId ?? '');

  if (!card) return <Loading wat='Card' />;
  if (!flier) return <Loading wat='Flier' />;

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
    if (specials.length > 0) specials.push(<hr key='hr' />);
    specials.push(
      <div key={specials.length} className={styles.notes}>
        {card.notes}
      </div>
    );
  }

  return (
    <>
      <AttendeeInfo
        className='h2 mb-3 me-2 flex-grow-1 p-1 bg-light border border-dark rounded'
        attendee={flier}
      />

      <div>
        <div
          className='d-grid'
          style={{ gridTemplateColumns: 'max-content 1fr', gap: '.5em 1em' }}
        >
          <div className='text-muted'>Name (Mfg.)</div>
          <div>
            <span className={styles.name}>
              {card.rocket?.name ? `"${card.rocket.name}"` : '(unnamed )'}
            </span>{' '}
            <span className={styles.manufacturer}>
              {card.rocket?.manufacturer
                ? `(${card.rocket?.manufacturer})`
                : null}
            </span>
          </div>

          {card.rocket?.color ? (
            <>
              <div className='text-muted'>Color(s)</div>
              <div className='d-flex'>
                <span className='flex-grow-0'>{card.rocket?.color}</span>
                <div
                  className='d-flex flex-row ms-2 my-1 border border-dark'
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

          <div className='text-muted'>Len. x Diam.</div>
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

          {card.rocket?.recovery ? (
            <>
              <div className='text-muted'>Recovery(s)</div>
              <div className='text-capitalize'>{card?.rocket?.recovery}</div>
            </>
          ) : null}

          <div className='text-muted'>{simplur`${[
            card?.motors?.length ?? 0,
          ]}Motor[s|]`}</div>
          <MotorsList motors={card.motors} />
        </div>
      </div>
      {specials.length ? (
        <>
          <Alert className='mt-2' variant='warning'>
            {specials}
          </Alert>
        </>
      ) : null}
      <div className='d-flex justify-content-between align-items-start'>
        <QuickUnits />
        <FCLinkButton
          className='text-nowrap my-auto'
          to={`/launches/${launchId}/cards/${cardId}`}
        >
          <Icon name='pencil-fill' /> Edit
        </FCLinkButton>
      </div>
    </>
  );
}
