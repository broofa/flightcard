import React, { HTMLAttributes, useMemo, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useMatch } from 'react-router-dom';
import { TCMotor } from 'thrustcurve-db';
import { useIsOfficer } from '../contexts/OfficersContext';
import { useCurrentAttendee, usePads, useUserUnits } from '../contexts/rthooks';
import { AttendeeInfo } from '../Launch/UserList';
import UnitsPref from '../Profile/UnitsPref';
import { rtuiFromPath } from '../rtui/RTUI';
import { CardActions } from './CardActions';
import ColorChits from './ColorChits';
import MotorAnalysis from './MotorAnalysis';
import { MotorDetail } from './MotorDetail';
import { MotorEditor } from './MotorEditor';
import { MotorList } from './MotorList';
import UnitsFAQ from './UnitsFAQ';
import { cn, Loading } from '/components/common/util';
import { useRTValue } from '/rt';
import { MKS } from '/util/units';

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
    <div className={cn(className, `text-muted h2 mt-3`)} {...props}>
      {children}
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
  const disabled = attendee?.id !== flier?.id;

  const colorsPath = ROCKET_PATH.append('color').with(cardFields);
  const [colors] = useRTValue<string>(colorsPath);

  const rtui = useMemo(() => {
    return rtuiFromPath(cardPath, userUnits);
  }, [cardPath, userUnits]);

  if (!card) return <Loading wat='Card' />;
  if (!attendee) return <Loading wat='Current user' />;
  if (!pads) return <Loading wat='Pads' />;

  const isOwner = attendee?.id == card?.userId;
  const isDraft = card?.status === CardStatus.DRAFT;
  const isReadOnly = !isDraft && !isOfficer;

  const nMotors = Object.keys(card?.motors ?? {}).length;

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

      {flier && !isOwner ? (
        <>
          <FormSection>Flier</FormSection>
          <AttendeeInfo className='me-3' attendee={flier} />
        </>
      ) : null}

      <FormSection className='d-flex'>Rocket</FormSection>

      <UnitsFAQ />

      <div className='d-grid deck'>
        <rtui.StringInput
          disabled={isReadOnly}
          field='rocket/name'
          label='Rocket Name'
        />
        <rtui.StringInput
          disabled={isReadOnly}
          field='rocket/manufacturer'
          label='Manufacturer'
        />

        <rtui.UnitField
          disabled={isReadOnly}
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
          disabled={isReadOnly}
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
          disabled={isReadOnly}
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

        <div className='d-flex flex-grow-1'>
          <rtui.StringInput
            disabled={isReadOnly}
            field='rocket/color'
            label='Colors'
            className='flex-grow-1'
          />
          {colors && (
            <div className='d-flex flex-column ms-1' style={{ width: '15px' }}>
              <ColorChits colors={colors} className='flex-grow-1' />
            </div>
          )}
        </div>

        <rtui.Select
          disabled={isReadOnly}
          label='Recovery'
          field='flight/recovery'
        >
          <option value={''}>Unspecified</option>
          <option value={Recovery.CHUTE}>Chute</option>
          <option value={Recovery.STREAMER}>Streamer</option>
          <option value={Recovery.DUAL_DEPLOY}>Dual-Deploy</option>
          <option value={Recovery.TUMBLE}>Tumble</option>
          <option value={Recovery.GLIDE}>Glide</option>
          <option value={Recovery.HELICOPTER}>Helicopter</option>
        </rtui.Select>
      </div>

      <FormSection className='d-flex justify-content-between'>
        <div>Motors</div>
        <Button disabled={isReadOnly} onClick={() => setEditMotor({ id: '' })}>
          Add Motor...
        </Button>
      </FormSection>

      {cardFields && (
        <MotorList
          disabled={isReadOnly}
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
          <rtui.Check
            disabled={isReadOnly}
            field='flight/firstFlight'
            label='1st Flight'
          />
          <rtui.Check
            disabled={isReadOnly}
            field='flight/headsUp'
            label='Heads Up'
          />

          {/* Complex status is derived from # of motors */}
          <Form.Check
            type='switch'
            disabled
            checked={nMotors > 1}
            label='Complex'
          />
        </div>
      </div>

      <rtui.TextArea disabled={isReadOnly} field='notes' label='Notes' />

      <FormSection>Next Steps &hellip;</FormSection>
      <CardActions card={card} />

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
