import React, {
  HTMLAttributes,
  ReactElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useMatch, useNavigate } from 'react-router-dom';
import { padThrust } from '../../util/motor-util';
import { sortArray } from '../../util/sortArray';
import { MKS, unitConvert, unitParse } from '../../util/units';
import { AppContext } from '../App/App';
import { createContext } from '../common/RTUI';
import { MotorDataList } from './MotorDataList';
import { MotorList } from './MotorList';
import UnitsFAQ from './UnitsFAQ';
import { Loading, sig } from '/components/common/util';
import { AttendeeInfo } from '/components/UserList';
import { db, DELETE } from '/firebase';
import { CardStatus, iCard, iUser, Recovery } from '/types';

// Force of gravity (m/^2)
const GRAVITY_ACC = 9.8066500286389;

function FormSection({
  className,
  children,
  ...props
}: { className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`text-muted h2 mt-3 ${className ?? ''}`} {...props}>
      {children}
    </div>
  );
}

export default function CardEditor() {
  const navigate = useNavigate();
  const { userUnits, attendee, cards, launch, pads } = useContext(AppContext);
  const match = useMatch('launches/:launchId/cards/:cardId');
  const { cardId, launchId } = match?.params ?? {};
  const [xxxCard, setCard] = useState<iCard>();
  const flier = db.attendee.useValue(launchId, xxxCard?.userId);

  const dbCard = cardId && cards?.[cardId];
  const disabled = attendee?.id !== flier?.id;

  const rtui = useMemo(() => {
    return createContext(`/cards/${launchId}/${cardId}`, userUnits);
  }, [launchId, cardId, userUnits]);

  useEffect(() => {
    let nc: iCard;
    if (dbCard) {
      nc = JSON.parse(JSON.stringify(dbCard));

      // Convert to display units
      if (nc.rocket?.length != null)
        nc.rocket.length = unitConvert(
          nc.rocket.length,
          MKS.length,
          userUnits.length
        );
      if (nc.rocket?.diameter != null)
        nc.rocket.diameter = unitConvert(
          nc.rocket.diameter,
          MKS.length,
          userUnits.length
        );
      if (nc.rocket?.mass != null)
        nc.rocket.mass = unitConvert(nc.rocket.mass, MKS.mass, userUnits.mass);
    } else {
      nc = { launchId, userId: (attendee as iUser)?.id } as iCard;
    }

    setCard(nc);
  }, [dbCard, attendee, launchId, userUnits]);

  function poke(path: string, val) {
    const parts = path.split('.');
    const att = parts.pop();

    const newCard: iCard = { ...xxxCard } as iCard;

    if (!att) return;
    let o = newCard;
    for (const k of parts) {
      o = o[k] = Object.assign({}, o[k]);
    }
    o[att] = val;

    setCard(newCard);
  }

  function cardUpdate(update: Partial<iCard>) {
    if (!xxxCard?.id) return;
    return db.card.update(launchId, xxxCard.id, update);
  }

  function setCardStatus(status?: CardStatus) {
    if (!xxxCard?.id) return;

    const update = { status: status ?? DELETE } as Partial<iCard>;

    if (!status) update.rsoId = update.lcoId = DELETE;
    if (status == CardStatus.READY) update.rsoId = attendee?.id ?? DELETE;
    if (!status || status == CardStatus.REVIEW) update.rsoId = DELETE;
    if (!status || status == CardStatus.DONE)
      update.lcoId = attendee?.id ?? DELETE;

    return cardUpdate(update);
  }

  if (!xxxCard) return <Loading wat='Card' />;
  if (!attendee) return <Loading wat='Current user' />;
  if (!launch) return <Loading wat='Launch' />;
  if (!pads) return <Loading wat='Pads' />;

  const isOwner = attendee?.id == xxxCard?.userId;
  const isNew = !xxxCard.id;
  const isFlier = !attendee.role;
  const isRSO = attendee.role === 'rso';
  const isLCO = attendee.role === 'lco';
  const isDraft = !xxxCard?.status;
  const isReview = xxxCard?.status == CardStatus.REVIEW;
  const isReady = xxxCard?.status == CardStatus.READY;

  const onDelete =
    xxxCard?.id && isOwner
      ? async () => {
          // TODO: Disallow deletion of cards that are ready to fly or that have been flown
          if (
            !confirm(
              `Delete the rocket named '${
                xxxCard.rocket?.name ?? '(unnamed rocket)'
              }'? (This cannot be undone!)`
            )
          )
            return;
          await db.card.remove(xxxCard.launchId, xxxCard.id);
          navigate(-1);
        }
      : null;

  // Compose action buttons based on role / card status
  const actions: ReactElement[] = [];
  if (isFlier && isOwner) {
    if (isDraft && !isNew) {
      actions.push(
        <Button key='f1' onClick={() => setCardStatus(CardStatus.REVIEW)}>
          Request RSO Review
        </Button>
      );
    }
    if (isReview) {
      actions.push(
        <Button key='f2' onClick={() => setCardStatus()}>
          Withdraw RSO Request
        </Button>
      );
    }
  }

  if (isRSO && isReview && !isOwner) {
    if (isReview) {
      actions.push(
        <Button key='r1' variant='warning' onClick={() => setCardStatus()}>
          RSO Decline
        </Button>
      );
      actions.push(
        <Button key='r2' onClick={() => setCardStatus(CardStatus.READY)}>
          RSO Approve
        </Button>
      );
    }
  }

  if (isLCO && isReady && !isOwner) {
    actions.push(
      <Button
        key='l1'
        variant='warning'
        onClick={() => setCardStatus(CardStatus.REVIEW)}
      >
        RSO Review
      </Button>
    );
    if (xxxCard.padId) {
      actions.push(
        <Button
          key='l3'
          variant='warning'
          onClick={() => cardUpdate({ padId: DELETE })}
        >
          Clear Pad
        </Button>
      );
    }
    actions.push(
      <Button key='l4' onClick={() => setCardStatus(CardStatus.DONE)}>
        Done
      </Button>
    );
  }

  // Compose card status
  let cardStatus;
  switch (true) {
    case !xxxCard.status: {
      cardStatus = <p>This is a draft</p>;
      break;
    }

    case xxxCard.status == CardStatus.REVIEW: {
      cardStatus = <p>Waiting for RSO review</p>;
      break;
    }

    case (isOwner || isLCO) && xxxCard.status == CardStatus.READY: {
      const padOptions = sortArray(
        Object.values(pads),
        pad => `${pad.group ?? ''} ${pad.name}`
      ).map(pad => (
        <option key={pad.id} value={pad.id}>
          {pad.group ? `${pad.group} : ` : ''}
          {pad.name}
        </option>
      ));

      cardStatus = (
        <>
          <div className='d-flex align-items-baseline gap-1 mt-2'>
            <label className='text-nowrap'>On pad</label>
            <Form.Select
              value={xxxCard?.padId ?? ''}
              onChange={e =>
                poke('padId', (e.target as HTMLSelectElement).value || DELETE)
              }
            >
              <option value=''>Select Pad...</option>
              {padOptions}
            </Form.Select>
          </div>
          {!xxxCard?.padId ? (
            <div className='mt-1 text-secondary small'>
              (Only select pad after rocket is on the pad and ready for launch)
            </div>
          ) : null}
        </>
      );

      break;
    }

    case xxxCard.status == CardStatus.READY: {
      cardStatus = <p>Ready to fly.</p>;
      break;
    }

    case xxxCard.status == CardStatus.DONE: {
      cardStatus = <p>This card is complete.</p>;
      break;
    }
  }

  // Thrust:weight analysis
  let thrustRatio = NaN;
  let thrust = NaN;
  let mass = NaN;

  if (xxxCard) {
    try {
      thrust = padThrust(xxxCard);
      mass = unitParse(xxxCard.rocket?.mass ?? '', userUnits.mass, MKS.mass);
    } catch (err) {
      // Fail silently ()
    }
  }
  try {
    thrustRatio = thrust / (mass * GRAVITY_ACC);
  } catch (err) {}

  return (
    <>
      <MotorDataList id='tc-motors' />

      {flier ? (
        <>
          <FormSection>Flier</FormSection>
          <AttendeeInfo className='me-3' attendee={flier} />
        </>
      ) : null}

      <FormSection className='d-flex align-items-baseline'>
        <span>Status</span>
        <span
          className='flex-grow-1 text-end'
          style={{ fontSize: '8pt', color: '#ccc' }}
        >
          card status: {xxxCard.status ?? 'draft'}
        </span>
      </FormSection>

      {cardStatus}

      <FormSection>Rocket</FormSection>

      <UnitsFAQ />

      <div className='d-grid deck'>
        <rtui.StringInput field='rocket/name' label='Rocket Name' />
        <rtui.StringInput field='rocket/manufacturer' label='Manufacturer' />

        <rtui.UnitField
          field='rocket/length'
          unitType='length'
          label={
            <>
              Length{' '}
              <span className='text-info ms-2'>({userUnits.length})</span>
            </>
          }
        />

        <rtui.UnitField
          field='rocket/diameter'
          unitType='length'
          label={
            <>
              Diameter{' '}
              <span className='text-info ms-2'>({userUnits.length})</span>
            </>
          }
        />

        <rtui.UnitField
          field='rocket/mass'
          unitType='mass'
          label={
            <>
              Mass{' '}
              <span className='text-info ms-2'>
                {' '}
                ({userUnits.mass}, incl. motors)
              </span>
            </>
          }
        />

        <rtui.StringInput field='rocket/color' label='Color' />
      </div>

      <div
        className='d-flex rounded border my-3 py-2 px-3'
        style={{
          borderColor: '#ced4da',
          backgroundColor: disabled ? '#e9ecef' : 'inherit',
        }}
      >
        <span className='me-3 flex-grow-0'>Recovery</span>
        <div
          className='flex-grow-1 d-grid'
          style={{
            gap: '.5em 1em',
            gridTemplateColumns: 'repeat(auto-fit, minmax(8em, 1fr)',
          }}
        >
          <rtui.Radio
            field='flight/recovery'
            label='Chute'
            value={Recovery.CHUTE}
          />
          <rtui.Radio
            field='flight/recovery'
            label='Streamer'
            value={Recovery.STREAMER}
          />
          <rtui.Radio
            field='flight/recovery'
            label='Dual-deploy'
            value={Recovery.DUAL_DEPLOY}
          />
        </div>
      </div>

      <FormSection>Motors</FormSection>

      {launchId && cardId && <MotorList launchId={launchId} cardId={cardId} />}

      {isNaN(thrustRatio) ? null : (
        <Alert
          className='mt-3 p-2'
          variant={thrustRatio >= 5 ? 'success' : 'danger'}
        >
          Stage 1 thrust:weight ratio is{' '}
          <strong>{sig(thrustRatio, 2)} : 1</strong>
        </Alert>
      )}

      <FormSection>Flight</FormSection>

      <div
        className='d-flex rounded border my-3 py-2 px-3'
        style={{
          borderColor: '#ced4da',
          backgroundColor: disabled ? '#e9ecef' : 'inherit',
        }}
      >
        <span className='me-3 flex-grow-0'>Special</span>
        <div
          className='flex-grow-1 d-grid'
          style={{
            gap: '.5em 1em',
            gridTemplateColumns: 'repeat(auto-fit, minmax(8em, 1fr)',
          }}
        >
          <rtui.Check field='flight/firstFlight' label='1st Flight' />
          <rtui.Check field='flight/headsUp' label='Heads Up' />
          <rtui.Check field='flight/complex' label='Complex' />
        </div>
      </div>

      <rtui.TextArea field='flight/notes' label='Notes' />

      <div className='mt-4 d-flex gap-3'>
        {onDelete ? (
          <Button variant='danger' onClick={onDelete} tabIndex={-1}>
            Delete
          </Button>
        ) : null}
        {actions}
        <div className='flex-grow-1' />
        <Button variant='secondary' onClick={() => navigate(-1)}>
          Close
        </Button>
      </div>
    </>
  );
}
