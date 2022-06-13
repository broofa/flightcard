import { nanoid } from 'nanoid';
import React, {
  HTMLAttributes,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Alert, Button, Form, FormCheckProps } from 'react-bootstrap';
import { useMatch, useNavigate } from 'react-router-dom';
import { padThrust } from '../../util/motor-util';
import { sortArray } from '../../util/sortArray';
import { MKS, unitConvert, unitParse } from '../../util/units';
import { MotorList } from './MotorList';
import { MotorDataList } from './MotorDataList';
import { AppContext } from '../App/App';
import { errorTrap, showError } from '/components/common/ErrorFlash';
import FloatingInput from '/components/common/FloatingInput';
import { Loading, sig } from '/components/common/util';
import { AttendeeInfo } from '/components/UserList';
import { db, DELETE } from '/firebase';
import { CardStatus, iCard, iMotor, iUser, Recovery } from '/types';

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
  const [card, setCard] = useState<iCard>();
  const flier = db.attendee.useValue(launchId, card?.userId);

  const dbCard = cardId && cards?.[cardId];
  const disabled = attendee?.id !== flier?.id;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function peek(path: string): any {
    const val = path.split('.').reduce((o, k) => o?.[k], card);
    return typeof val === 'number' ? sig(val) : val;
  }

  function poke(path: string, val) {
    const parts = path.split('.');
    const att = parts.pop();

    const newCard: iCard = { ...card } as iCard;

    if (!att) return;
    let o = newCard;
    for (const k of parts) {
      o = o[k] = Object.assign({}, o[k]);
    }
    o[att] = val;

    setCard(newCard);
  }

  function textInputProps(path: string, units?: string) {
    const value = peek(path) ?? '';

    return {
      disabled,
      value,
      onChange({ target }) {
        if (units) {
          target.setCustomValidity('');
          try {
            unitParse(target.value, units);
          } catch (error) {
            target.setCustomValidity((error as Error).message);
          }

          target.reportValidity();
        }
        poke(path, target.value);
      },

      onBlur({ target }) {
        if (units) {
          try {
            poke(path, unitParse(target.value, units));
          } catch (err) {
            // TODO: Don't put unparsable values in DB
          }
        }
      },
    };
  }

  function switchInputProps(path: string): FormCheckProps {
    return {
      id: path,
      checked: !!peek(path),
      type: 'switch',
      disabled,
      onChange({ target }) {
        poke(path, target.checked || DELETE);
      },
    };
  }

  const faq = (
    <details className='bg-light rounded mb-2 px-2 flex-grow-1'>
      <summary className='text-tip flex-grow-1'>
        FAQ: How do I enter values with different units?
      </summary>

      <p className='mt-3'>
        Values may be entered using any of the notations shown below:
      </p>

      <p>
        Note: Use the singular form. (E.g. "m", not "ms"). Plural forms are not
        recognized.
      </p>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '.2em 1em',
        }}
      >
        {/* Length */}
        <div className='fw-normal text-end'>Length (metric)</div>
        <div>
          <code>1m</code>, <code>1cm</code>, <code>1mm</code>
        </div>

        <div className='fw-normal text-end'>Length (imperial)</div>
        <div>
          <code>1ft</code>, <code>1'</code>, <code>1in</code>, <code>1"</code>,{' '}
          <code>1'1"</code>, <code>1ft 1in</code>
        </div>

        <div className='fw-normal text-end'>Mass (metric)</div>
        <div>
          <code>1kg</code>, <code>1g</code>
        </div>

        <div className='fw-normal text-end'>Mass (imperial)</div>
        <div>
          <code>1lb</code>, <code>1oz</code>, <code>1lb 1oz</code>
        </div>

        <div className='fw-normal text-end'>Thrust/force (metric)</div>
        <div>
          <code>1n</code>
        </div>

        <div className='fw-normal text-end'>Thrust/force (imperial)</div>
        <div>
          <code>1lbf</code>
        </div>

        <div className='fw-normal text-end'>Impulse (metric)</div>
        <div>
          <code>1n-s</code>,&ensp;
          <code>1n-sec</code>
        </div>

        <div className='fw-normal text-end'>Impulse (imperial)</div>
        <div>
          <code>1lbf-s</code>,&ensp;
          <code>1lbf-sec</code>
        </div>
      </dl>
    </details>
  );

  function cardUpdate(update: Partial<iCard>) {
    if (!card?.id) return;
    return db.card.update(launchId, card.id, update);
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
  if (!launch) return <Loading wat='Launch' />;
  if (!pads) return <Loading wat='Pads' />;

  const isOwner = attendee?.id == card?.userId;
  const isNew = !card.id;
  const isFlier = !attendee.role;
  const isRSO = attendee.role === 'rso';
  const isLCO = attendee.role === 'lco';
  const isDraft = !card?.status;
  const isReview = card?.status == CardStatus.REVIEW;
  const isReady = card?.status == CardStatus.READY;

  const onSave =
    isOwner || isLCO || isRSO
      ? async function () {
          if (!card) return;

          if (!card.id) card.id = nanoid();

          // validate
          try {
            const { rocket } = card;

            // Convert unit-based properties
            if (rocket?.length != null) {
              rocket.length =
                unitConvert(rocket.length, userUnits.length, MKS.length) ||
                DELETE;
            }
            if (rocket?.diameter != null) {
              rocket.diameter =
                unitConvert(rocket.diameter, userUnits.length, MKS.length) ||
                DELETE;
            }
            if (rocket?.mass != null) {
              rocket.mass =
                unitConvert(rocket.mass, userUnits.mass, MKS.mass) || DELETE;
            }
          } catch (err) {
            showError(err);
            return;
          }

          await errorTrap(db.card.set(card.launchId, card.id, card));
          navigate(-1);
        }
      : null;

  const onDelete =
    card?.id && isOwner
      ? async () => {
          // TODO: Disallow deletion of cards that are ready to fly or that have been flown
          if (
            !confirm(
              `Delete the rocket named '${
                card.rocket?.name ?? '(unnamed rocket)'
              }'? (This cannot be undone!)`
            )
          )
            return;
          await db.card.remove(card.launchId, card.id);
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
    if (card.padId) {
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
    case !card.status: {
      cardStatus = <p>This is a draft</p>;
      break;
    }

    case card.status == CardStatus.REVIEW: {
      cardStatus = <p>Waiting for RSO review</p>;
      break;
    }

    case (isOwner || isLCO) && card.status == CardStatus.READY: {
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
              value={card?.padId ?? ''}
              onChange={e =>
                poke('padId', (e.target as HTMLSelectElement).value || DELETE)
              }
            >
              <option value=''>Select Pad...</option>
              {padOptions}
            </Form.Select>
          </div>
          {!card?.padId ? (
            <div className='mt-1 text-secondary small'>
              (Only select pad after rocket is on the pad and ready for launch)
            </div>
          ) : null}
        </>
      );

      break;
    }

    case card.status == CardStatus.READY: {
      cardStatus = <p>Ready to fly.</p>;
      break;
    }

    case card.status == CardStatus.DONE: {
      cardStatus = <p>This card is complete.</p>;
      break;
    }
  }

  // Thrust:weight analysis
  let thrustRatio = NaN;
  let thrust = NaN;
  let mass = NaN;

  if (card) {
    try {
      thrust = padThrust(card);
      mass = unitParse(card.rocket?.mass ?? '', userUnits.mass, MKS.mass);
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
          card status: {card.status ?? 'draft'}
        </span>
      </FormSection>

      {cardStatus}

      <FormSection>Rocket</FormSection>

      {faq}

      <div className='d-grid deck'>
        <FloatingInput {...textInputProps('rocket.name')}>
          <label>Rocket Name</label>
        </FloatingInput>

        <FloatingInput {...textInputProps('rocket.manufacturer')}>
          <label>Manufacturer</label>
        </FloatingInput>

        <FloatingInput {...textInputProps('rocket.length', userUnits.length)}>
          <label>
            Length <span className='text-info ms-2'>({userUnits.length})</span>
          </label>
        </FloatingInput>

        <FloatingInput {...textInputProps('rocket.diameter', userUnits.length)}>
          <label>
            Diameter{' '}
            <span className='text-info ms-2'>({userUnits.length})</span>
          </label>
        </FloatingInput>

        <FloatingInput {...textInputProps('rocket.mass', userUnits.mass)}>
          <label>
            Mass{' '}
            <span className='text-info ms-2'>
              ({userUnits.mass}, incl. motors)
            </span>
          </label>
        </FloatingInput>

        <FloatingInput {...textInputProps('rocket.color')}>
          <label>Color</label>
        </FloatingInput>
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
          {[
            ['Chute', Recovery.CHUTE],
            ['Streamer', Recovery.STREAMER],
            ['Dual-deploy', Recovery.DUAL_DEPLOY],
          ].map(([label, value]) => (
            <Form.Check
              id={`recovery-${value}`}
              key={label}
              label={label}
              disabled={disabled}
              type='radio'
              className='me-4 text-nowrap'
              checked={peek('rocket.recovery') === value}
              onChange={e =>
                poke('rocket.recovery', e.target.checked ? value : DELETE)
              }
            />
          ))}
        </div>
      </div>

      <FormSection>Motors</FormSection>

      <MotorList
        motors={card.motors ?? ([] as iMotor[])}
        onChange={(motors?: iMotor[]) => poke('motors', motors)}
      />

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
          <Form.Check
            {...switchInputProps('flight.firstFlight')}
            label='1st Flight'
          />
          <Form.Check
            {...switchInputProps('flight.headsUp')}
            label='Heads Up'
          />
          <Form.Check {...switchInputProps('flight.complex')} label='Complex' />
        </div>
      </div>

      {/* Use floating labels once https://github.com/twbs/bootstrap/issues/32800 is fixed */}
      <label htmlFor='notes'>Notes</label>
      <textarea
        id='notes'
        className='form-control rounded'
        {...textInputProps('flight.notes')}
      />

      <div className='mt-4 d-flex gap-3'>
        {onDelete ? (
          <Button variant='danger' onClick={onDelete} tabIndex={-1}>
            Delete
          </Button>
        ) : null}
        {actions}
        <div className='flex-grow-1' />
        <Button variant='secondary' onClick={() => navigate(-1)}>
          Cancel
        </Button>
        {onSave ? <Button onClick={onSave}>Save Card</Button> : null}
      </div>
    </>
  );
}
