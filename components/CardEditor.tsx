import { nanoid } from 'nanoid';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { db, DELETE } from '../firebase';
import { iCard, iUser, tCardStatus } from '../types';
import { sortArray } from '../util/sortArray';
import { MKS, tUnitSystem, unitConvert, unitParse, USCS } from '../util/units';
import { AppContext } from './App';
import { errorTrap, showError } from './common/ErrorFlash';
import FloatingInput from './common/FloatingInput';
import { Loading, sig, tChildren, tProps } from './common/util';
import Editor from './Editor';
import { AttendeeInfo } from './UserList';

function FormSection({ className, children, ...props }
  : { className ?: string, children : tChildren } & tProps) {
  return <div className={`text-muted h2 mt-3 ${className ?? ''}`} {...props}>
    {children}
  </div>;
}

export default function CardEditor() {
  const history = useHistory();
  const { currentUser, attendee, cards, launch, pads } = useContext(AppContext);
  const match = useRouteMatch<{launchId : string, cardId : string}>();
  const { cardId, launchId } = match.params;
  const [card, setCard] = useState<iCard>();
  const flier = db.attendee.useValue(launchId, card?.userId);

  const dbCard = cards?.[cardId];
  const disabled = attendee?.id !== flier?.id;

  const unitSystem : tUnitSystem = currentUser?.units == 'uscs' ? USCS : MKS;

  useEffect(() => {
    let nc;
    if (dbCard) {
      nc = JSON.parse(JSON.stringify(dbCard));

      // Convert to display units
      if (nc.rocket?.length != null) nc.rocket.length = unitConvert(nc.rocket.length, MKS.length, unitSystem.length);
      if (nc.rocket?.diameter != null) nc.rocket.diameter = unitConvert(nc.rocket.diameter, MKS.length, unitSystem.length);
      if (nc.rocket?.mass != null) nc.rocket.mass = unitConvert(nc.rocket.mass, MKS.mass, unitSystem.mass);
      if (nc.motor?.impulse != null) nc.motor.impulse = unitConvert(nc.motor.impulse, MKS.impulse, unitSystem.impulse);
    } else {
      nc = { launchId, userId: (attendee as iUser)?.id } as iCard;
    }

    setCard(nc);
  }, [dbCard, attendee, launchId, unitSystem]);

  function peek(path : string) {
    const val : any = path.split('.').reduce((o, k) => o?.[k], card as any);
    return typeof (val) === 'number' ? sig(val) : val;
  }

  function poke(path : string, val) {
    const parts = path.split('.');
    const att = parts.pop();

    const newCard : iCard = { ...card } as iCard;

    if (!att) return;
    let o = newCard;
    for (const k of parts) {
      o = o[k] = Object.assign({}, o[k]);
    }
    o[att] = val;

    setCard(newCard);
  }

  function textInputProps(path : string, unit ?: string) {
    const value = peek(path) ?? '';

    return {
      disabled,
      value,
      onChange({ target }) {
        poke(path, target.value);
      },

      onBlur(e) {
        if (unit) {
          try {
            const val = unitParse(e.target.value, unit);
            poke(path, val);
          } catch (err) {
            // TODO: Don't put unparsable values in DB
          }
        }
      }
    };
  }

  function switchInputProps(path) : any {
    return {
      id: path,
      checked: !!peek(path),
      type: 'switch',
      disabled,
      onChange({ target }) {
        poke(path, target.checked || DELETE);
      }
    };
  }

  async function onSave() {
    if (!card) return;

    if (!card.id) card.id = nanoid();

    // validate
    try {
      if (card.userId != attendee?.id) throw Error('You are not allowed to edit someone else\'s card');

      const { rocket, motor } = card;

      // Convert
      if (rocket) {
        rocket.length = unitConvert(rocket.length, unitSystem.length, MKS.length) || DELETE;
        rocket.diameter = unitConvert(rocket.diameter, unitSystem.length, MKS.length) || DELETE;
        rocket.mass = unitConvert(rocket.mass, unitSystem.mass, MKS.mass) || DELETE;
      }
      if (motor) {
        motor.impulse = unitConvert(motor.impulse, unitSystem.impulse, MKS.impulse) || DELETE;
      }
    } catch (err) {
      showError(err);
      return;
    }

    await errorTrap(db.card.set(card.launchId, card.id, card));
    history.goBack();
  }

  const onDelete = card?.id
    ? async () => {
      // TODO: Disallow deletion of cards that are ready to fly or that have been flown
      if (!confirm(`Delete the rocket named '${card.rocket?.name ?? '(unnamed rocket)'}'? (This cannot be undone!)`)) return;
      await db.card.remove(card.launchId, card.id);
      history.goBack();
    }
    : null;

  const faq = <details className='bg-light rounded mb-2 px-2 flex-grow-1'>
    <summary className='text-secondary fst-italic small flex-grow-1'>FAQ: How do I enter values with different units?</summary>

    <p className='mt-3'>
      Values may be entered using any of the notations shown below:
    </p>

    <p>Note: Use the singular form. (E.g. "m", not "ms").  Plural forms are not recognized.</p>

    <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '.2em 1em' }}>
      {/* Length */}
      <div className='fw-normal text-end'>Length (metric)</div>
      <div>
        <code>1m</code>, <code>1cm</code>, <code>1mm</code>
      </div>

      <div className='fw-normal text-end'>Length (imperial)</div>
      <div>
        <code>1ft</code>, <code>1'</code>, <code>1in</code>, <code>1"</code>, <code>1'1"</code>, <code>1ft 1in</code>
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
      <div><code>1n</code></div>

      <div className='fw-normal text-end'>Thrust/force (imperial)</div>
      <div><code>1lbf</code></div>

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
  </details>;

  function cardUpdate(update : Partial<iCard>) {
    if (!card?.id) return;
    return db.card.update(launchId, card.id, update);
  }

  function setCardStatus(status ?: tCardStatus) {
    if (!card?.id) return;

    const update = { status: status ?? DELETE } as Partial<iCard>;

    if (!status) update.rsoId = update.lcoId = DELETE;
    if (status == 'ready') update.rsoId = attendee?.id ?? DELETE;
    if (!status || status == 'review') update.rsoId = DELETE;
    if (!status || status == 'done') update.lcoId = attendee?.id ?? DELETE;

    return cardUpdate(update);
  }

  if (!card) return <Loading wat='Card' />;
  if (!attendee) return <Loading wat='Current user' />;
  if (!launch) return <Loading wat='Launch' />;
  if (!pads) return <Loading wat='Pads' />;

  const isOwner = card?.userId == attendee?.id;
  const isNew = !card.id;
  const isFlier = !attendee.role;
  const isRSO = attendee.role === 'rso';
  const isLCO = attendee.role === 'lco';
  const isDraft = !card?.status;
  const isReview = card?.status == 'review';
  const isReady = card?.status == 'ready';

  // Compose action buttons based on role / card status
  const actions : any[] = [];
  if (isFlier && isOwner) {
    if (isDraft && !isNew) {
      actions.push(<Button key='f1' onClick={() => setCardStatus('review')}>Request RSO Review</Button>);
    }
    if (isReview) {
      actions.push(<Button key='f2' onClick={() => setCardStatus()}>Withdraw RSO Request</Button>);
    }
  }

  if (isRSO && isReview && !isOwner) {
    if (isReview) {
      actions.push(<Button key='r1' variant='warning' onClick={() => setCardStatus()}>RSO Decline</Button>);
      actions.push(<Button key='r2' onClick={() => setCardStatus('ready')}>RSO Approve</Button>);
    }
  }

  if (isLCO && isReady && !isOwner) {
    actions.push(<Button key='l1' variant='warning' onClick={() => setCardStatus('review')}>RSO Review</Button>);
    if (card.padId) {
      actions.push(<Button key='l3' variant='warning' onClick={() => cardUpdate({ padId: DELETE })}>Clear Pad</Button>);
    }
    actions.push(<Button key='l4' onClick={() => setCardStatus('done')}>Done</Button>);
  }

  // Compose card status
  let cardStatus;
  switch (true) {
    case (!card.status): {
      cardStatus = <p>This is a draft</p>;
      break;
    }

    case (card.status == 'review'): {
      break;
    }

    case ((isOwner || isLCO) && card.status == 'ready'): {
      const padOptions = sortArray(
        Object.values(pads),
        pad => `${pad.group ?? ''} ${pad.name}`
      ).map(pad => <option key={pad.id} value={pad.id}>
        {pad.group ? `${pad.group} : ` : ''}{pad.name}
        </option>
      );

      cardStatus = <>
        <div className='d-flex align-items-baseline gap-1 mt-2'>
          <label className='text-nowrap'>On pad</label>
          <Form.Select value={card?.padId ?? ''} onChange={e => poke('padId', (e.target as HTMLSelectElement).value || DELETE)}>
            <option value=''>Select Pad...</option>
            {padOptions}
          </Form.Select>
        </div>
        {
          !card?.padId
            ? <div className='mt-1 text-secondary small'>(Only select pad after rocket is on the pad and ready for launch)</div>
            : null
        }
      </>;

      break;
    }

    case (card.status == 'ready'): {
      cardStatus = <p>Ready to fly.</p>;
      break;
    }

    case (card.status == 'done'): {
      cardStatus = <p>This card is complete.</p>;

      break;
    }
  }

  // Thrust:weight analysis
  let thrustRatio = NaN;
  try {
    const thrust : number = unitParse(/[a-z]([\d.]+)/i.test(card?.motor?.name ?? '') && RegExp.$1, MKS.force) ?? NaN;
    const mass : number = unitConvert(
      unitParse(card?.rocket?.mass, unitSystem.mass),
      unitSystem.mass,
      MKS.mass
    ) ?? NaN;
    thrustRatio = thrust / mass;
  } catch (err) {
    // Failed to parse
  }

  return <Editor
    onSave={disabled ? undefined : onSave}
    onCancel={() => history.goBack()}
    onDelete={(!disabled && onDelete) ? onDelete : undefined}>

    {
      actions.length
        ? <div className='mt-3 d-flex' style={{ gap: '1em' }}>{actions}</div>
        : null
    }

    {
      flier
        ? <>
          <FormSection className='d-flex'>
            <span>Flier</span>
            <span className='flex-grow-1 text-end' style={{ fontSize: '8pt', color: '#ccc' }}>
              card status: {card.status ?? 'no status'}
            </span>
          </FormSection>
          <AttendeeInfo className='me-3' attendee={flier} />
        </>
        : null
      }

    <FormSection>Status</FormSection>

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

      <FloatingInput {...textInputProps('rocket.length', unitSystem.length)} >
        <label>Length <span className='text-info ms-2'>({unitSystem.length})</span></label>
      </FloatingInput>

      <FloatingInput {...textInputProps('rocket.diameter', unitSystem.length)} >
        <label>Diameter <span className='text-info ms-2'>({unitSystem.length})</span></label>
      </FloatingInput>

      <FloatingInput {...textInputProps('rocket.mass', unitSystem.mass)} >
        <label>Mass <span className='text-info ms-2' >({unitSystem.mass}, incl. motors)</span></label>
      </FloatingInput>

      <FloatingInput {...textInputProps('rocket.color')}>
        <label>Color</label>
      </FloatingInput>
    </div>

    <div className='d-flex rounded border my-3 py-2 px-3'
      style={{ borderColor: '#ced4da', backgroundColor: disabled ? '#e9ecef' : 'inherit' }}>
      <span className='me-3 flex-grow-0'>Recovery</span>
      <div className='flex-grow-1 d-grid' style={{
        gap: '.5em 1em',
        gridTemplateColumns: 'repeat(auto-fit, minmax(8em, 1fr)'
      }}>
        {
          [['Chute', 'chute'], ['Streamer', 'streamer'], ['Dual-deploy', 'dual-deploy']]
            .map(([label, value]) => <Form.Check
            id={`recovery-${value}`}
            key={label}
            label={label}
            disabled={disabled}
            type='radio'
            className='me-4 text-nowrap'
            checked={peek('rocket.recovery') === value}
            onChange={e => poke('rocket.recovery', e.target.checked ? value : DELETE)}
          />)
        }
      </div>
    </div>

    <FormSection>Motor</FormSection>

    <div className='deck'>
      <div className='d-flex'>
        <FloatingInput className='flex-grow-1' {...textInputProps('motor.name')}>
          <label className='text-nowrap'>Designation <span className='text-info ms-2'>(e.g. C6-5)</span></label>
        </FloatingInput>
        {
          isNaN(thrustRatio)
            ? null
            : <Alert className={'m-0 ms-1 py-0 px-2 text-center'} variant={thrustRatio >= 5 ? 'success' : 'danger'}>Thrust:Mass<br />{sig(thrustRatio, 2)} : 1</Alert>
        }
      </div>

      <FloatingInput {...textInputProps('motor.impulse', unitSystem.impulse)} >
        <label>Impulse <span className='text-info ms-2'>({unitSystem.impulse})</span></label>
      </FloatingInput>
    </div>

    <FormSection>Flight</FormSection>

    <div className='d-flex rounded border my-3 py-2 px-3'
    style={{ borderColor: '#ced4da', backgroundColor: disabled ? '#e9ecef' : 'inherit' }}>
      <span className='me-3 flex-grow-0'>Special</span>
      <div className='flex-grow-1 d-grid' style={{ gap: '.5em 1em', gridTemplateColumns: 'repeat(auto-fit, minmax(8em, 1fr)' }}>
        <Form.Check {...switchInputProps('flight.firstFlight')} label='1st Flight' />
        <Form.Check {...switchInputProps('flight.headsUp')} label='Heads Up' />
        <Form.Check {...switchInputProps('flight.complex')} label='Complex' />
      </div>
    </div>

    {/* Use floating labels once https://github.com/twbs/bootstrap/issues/32800 is fixed */}
    <label htmlFor='notes'>Notes</label>
    <textarea id='notes' className='form-control rounded' {...textInputProps('flight.notes')} />
  </Editor>;
}
