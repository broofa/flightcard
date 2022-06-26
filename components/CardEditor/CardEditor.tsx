import React, { HTMLAttributes, ReactElement, useMemo, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useMatch, useNavigate } from 'react-router-dom';
import { Motor as TCMotor } from 'thrustcurve-db';
import { MKS } from '../../util/units';
import { flash } from '../common/Flash';
import { useCurrentAttendee, usePads, useUserUnits } from '../contexts/rthooks';
import { AttendeeInfo } from '../Launch/UserList';
import UnitsPref from '../Profile/UnitsPref';
import { rtuiFromPath } from '../rtui/RTUI';
import ColorChits from './ColorChits';
import MotorAnalysis from './MotorAnalysis';
import { MotorDataList } from './MotorDataList';
import { MotorDetail } from './MotorDetail';
import { MotorEditor } from './MotorEditor';
import { MotorList } from './MotorList';
import UnitsFAQ from './UnitsFAQ';
import { Loading } from '/components/common/util';
import { DELETE, rtRemove, rtUpdate, useRTValue } from '/rt';

import {
  AttendeeFields,
  ATTENDEE_PATH,
  CardFields,
  CARD_PATH,
  ROCKET_PATH,
} from '/rt/rtconstants';
import { CardStatus, iAttendee, iCard, iMotor, Recovery } from '/types';

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

function CardCrumbs({
  card,
}: { card: iCard } & HTMLAttributes<HTMLDivElement>) {
  const status = card.status ?? CardStatus.DRAFT;

  return (
    <div style={{ fontSize: '85%' }}>
      {['Draft', 'Review', 'Ready', 'Done'].map((label, i) => {
        const variant =
          i < status ? 'dark' : i > status ? 'secondary' : 'primary';
        return (
          <>
            <span
              className={`text-nowrap text=${variant} border-${variant} rounded`}
              key={label}
            >
              {label}
            </span>
            {i < 3 ? <span key={`arrow-${label}`}>{' \u{25B6} '}</span> : null}
          </>
        );
      })}
    </div>
  );
}

export default function CardEditor() {
  const [userUnits = MKS] = useUserUnits();
  const [attendee] = useCurrentAttendee();
  const [pads] = usePads();
  const [detailMotor, setDetailMotor] = useState<TCMotor>();
  const [editMotor, setEditMotor] = useState<iMotor>();
  const match = useMatch('launches/:launchId/cards/:cardId');
  const cardFields: CardFields = {
    launchId: match?.params.launchId ?? '',
    cardId: match?.params.cardId ?? '',
  };
  const [card] = useRTValue<iCard>(CARD_PATH.with(cardFields));
  const cardPath = CARD_PATH.with(cardFields);

  const navigate = useNavigate();

  const flierFields: AttendeeFields = {
    launchId: match?.params.launchId ?? '',
    userId: card?.userId ?? '',
  };
  const flierPath = ATTENDEE_PATH.with(flierFields);
  const [flier] = useRTValue<iAttendee>(flierPath);
  const disabled = attendee?.id !== flier?.id;

  const colorsPath = ROCKET_PATH.append('color').with(cardFields);
  const [colors] = useRTValue<string>(colorsPath);

  const rtui = useMemo(() => {
    return rtuiFromPath(cardPath, userUnits);
  }, [cardPath, userUnits]);

  function cardUpdate(update: Partial<iCard>) {
    return rtUpdate(cardPath, update);
  }

  function setCardStatus(status?: CardStatus) {
    if (!card?.id) return;

    const update = { status: status ?? DELETE } as Partial<iCard>;

    if (!status) update.rsoId = update.lcoId = DELETE;
    if (status == CardStatus.READY) update.rsoId = attendee?.id ?? DELETE;
    if (!status || status == CardStatus.REVIEW) update.rsoId = DELETE;
    if (!status || status == CardStatus.DONE)
      update.lcoId = attendee?.id ?? DELETE;

    return cardUpdate(update);
  }

  if (!card) return <Loading wat='Card' />;
  if (!attendee) return <Loading wat='Current user' />;
  if (!pads) return <Loading wat='Pads' />;

  const isOwner = attendee?.id == card?.userId;
  const isFlier = !attendee.role;
  const isRSO = attendee.role === 'rso';
  const isLCO = attendee.role === 'lco';
  const isDraft = !card?.status;
  const isReview = card?.status == CardStatus.REVIEW;
  const isReady = card?.status == CardStatus.READY;

  const onDelete =
    card?.id && isOwner
      ? async () => {
          // TODO: Disallow deletion of cards that are ready to fly or that have been flown
          if (
            !confirm(
              `Delete flight card for '${
                card.rocket?.name ?? '(unnamed rocket)'
              }'? (This cannot be undone!)`
            )
          )
            return;
          await rtRemove(
            CARD_PATH.with({ launchId: card.launchId, cardId: card.id })
          );
          flash('Flight card deleted');
          navigate(-1);
        }
      : null;

  // Compose action buttons based on role / card status
  const actions: ReactElement[] = [];
  if (isFlier && isOwner) {
    if (isDraft) {
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
    if (card.padId) {
      actions.push(
        <Button
          key='l3'
          variant='warning'
          onClick={() => cardUpdate({ padId: DELETE })}
        >
          Remove From Pad
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
  const cardStatus = (
    <>
      <div className='d-flex align-items-baseline gap-1 mt-2'>
        <label className='text-nowrap'>On pad</label>
        <strong>PAD SELECTION UI GOES HERE</strong>
        {/* <Form.Select
              value={card?.padId ?? ''}
              onChange={e =>
                poke('padId', (e.target as HTMLSelectElement).value || DELETE)
              }
            >
              <option value=''>Select Pad...</option>
              {padOptions}
            </Form.Select> */}
      </div>
      {!card?.padId ? (
        <div className='mt-1 text-tip'>
          (Only select pad after rocket is on the pad and ready for launch)
        </div>
      ) : null}
    </>
  );

  return (
    <>
      <MotorDataList id='tc-motors' />

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

      <CardCrumbs card={card} />

      {flier && !isOwner ? (
        <>
          <FormSection>Flier</FormSection>
          <AttendeeInfo className='me-3' attendee={flier} />
        </>
      ) : null}

      {cardStatus}

      <FormSection className='d-flex'>Rocket</FormSection>

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
          unitType='lengthSmall'
          label={
            <>
              Diameter{' '}
              <span className='text-info ms-2'>({userUnits.lengthSmall})</span>
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

        <div>
          <rtui.StringInput field='rocket/color' label='Colors' />
          {colors && <ColorChits colors={colors} className='mt-1' />}
        </div>
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

      <FormSection className='d-flex justify-content-between'>
        <div>Motors</div>
        <Button onClick={() => setEditMotor({ id: '' })}>Add Motor...</Button>
      </FormSection>

      {cardFields && (
        <MotorList
          rtFields={cardFields}
          setEditMotor={setEditMotor}
          setDetailMotor={setDetailMotor}
        />
      )}

      {cardFields && <MotorAnalysis rtFields={cardFields} />}

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

      {editMotor && cardFields ? (
        <MotorEditor
          rtFields={cardFields}
          motor={editMotor}
          onHide={() => setEditMotor(undefined)}
        />
      ) : null}

      {detailMotor ? (
        <MotorDetail
          motor={detailMotor}
          onHide={() => setDetailMotor(undefined)}
        />
      ) : null}
    </>
  );
}
