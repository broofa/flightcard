import { nanoid } from 'nanoid';
import React, { cloneElement, ReactElement, useContext, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { db, DELETE } from '../firebase';
import { iCard, iUser, tCardStatus } from '../types';
import { unitParse } from '../util/units';
import { AppContext, APPNAME } from './App';
import Editor from './Editor';
import { errorTrap, showError } from './ErrorFlash';
import { AttendeeInfo } from './UserList';
import { Loading, sig, tChildren, tProps } from './util';

function FormSection({ className, children, ...props }
  : { className ?: string, children : tChildren } & tProps) {
  return <div className={`text-muted h2 mt-3 ${className ?? ''}`} {...props}>
    {children}
  </div>;
}

function FloatingInput({ children, ...props } :
  {
    children : tChildren
  } & tProps) {
  const label = children as ReactElement;

  let id = label.props.children;
  if (Array.isArray(id)) {
    id = id.find(v => typeof (v) == 'string');
  }
  id = id.replace(/\s+/g, '_').toLowerCase();

  return <div className='form-floating'>
    <input
      id={id}
      placeholder={id}
      className='form-control'
      {...props}
    />

    {cloneElement(label, { htmlFor: id })}
  </div>;
}

export default function CardEditor() {
  const history = useHistory();
  const { attendee, cards } = useContext(AppContext);
  const match = useRouteMatch<{launchId : string, cardId : string}>();
  const { cardId, launchId } = match.params;
  const [card, setCard] = useState<iCard>();
  const flier = db.attendee.useValue(launchId, card?.userId);

  const dbCard = cards?.[cardId];

  useEffect(() => {
    setCard(
      dbCard
        ? JSON.parse(JSON.stringify(dbCard))
        : {
          // id undefined until save
          launchId,
          userId: (attendee as iUser).id
        } as iCard);
  }, [dbCard, attendee, launchId]);

  if (!card) return <Loading wat='Card' />;

  if (!attendee) return <Loading wat='Current user' />;

  const disabled = attendee?.id !== flier?.id;

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

  function textInputProps(path, parseUnits = false) {
    return {
      disabled,
      value: peek(path) ?? '',
      onChange({ target }) {
        poke(path, target.value);
      },

      onBlur(e) {
        if (parseUnits) {
          const val = unitParse(e.target.value);
          poke(path, val);
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

      if (rocket) {
        rocket.length = unitParse(rocket.length, 'Rocket length') || DELETE;
        rocket.diameter = unitParse(rocket.diameter, 'Rocket diameter') || DELETE;
        rocket.mass = unitParse(rocket.mass, 'Rocket mass') || DELETE;
      }
      if (motor) {
        motor.impulse = unitParse(motor.impulse, 'Motor impulse') || DELETE;
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
      // TODO: Disallow deletion of cards that are racked, or that have been flown

      if (!confirm(`Delete the rocket named '${card.rocket?.name ?? '(unnamed rocket)'}'? (This cannot be undone!)`)) return;
      await db.card.remove(card.launchId, card.id);
      history.goBack();
    }
    : null;

  const faq = <details className='border border-info rounded px-2 flex-grow-1'>
    <summary className='text-info flex-grow-1'>FAQ: How do I enter values with different units?</summary>

    <p className='mt-3'>
      {APPNAME} stores and displays all values in <a rel='noreferrer' href='https://en.wikipedia.org/wiki/MKS_system_of_units' target='_blank'>MKS</a>  (meter, kilogram, second)  units.  Values may be entered using other units as shown below, but will always be converted to MKS.
    </p>

    <p>Note: Use the singular form. (E.g. "gm", not "gms").  Plural forms are not recognized.</p>

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
        <code>1kg</code>, <code>1gm</code>
      </div>

      <div className='fw-normal text-end'>Mass (imperial)</div>
      <div>
        <code>1lb</code>, <code>1oz</code> <code>1lb 1oz</code>
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
      actions.push(<Button onClick={() => setCardStatus('review')}>Request RSO Review</Button>);
    }
    if (isReview) {
      actions.push(<Button onClick={() => setCardStatus()}>Withdraw RSO Request</Button>);
    }
  }

  if (isRSO && isReview && !isOwner) {
    if (isReview) {
      actions.push(<Button variant='warning' onClick={() => setCardStatus()}>RSO Decline</Button>);
      actions.push(<Button onClick={() => setCardStatus('ready')}>RSO Approve</Button>);
    }
  }

  if (isLCO && isReady && !isOwner) {
    actions.push(<Button variant='warning' onClick={() => setCardStatus('review')}>Needs RSO Review</Button>);
    actions.push(<Button variant='warning' onClick={() => setCardStatus('review')}>Will Not Launch</Button>);
    if (card.padId) {
      actions.push(<Button variant='warning' onClick={() => cardUpdate({ padId: DELETE })}>Clear Pad</Button>);
    }
    actions.push(<Button onClick={() => setCardStatus('done')}>Launch Complete</Button>);
  }

  return <Editor
    onSave={disabled ? undefined : onSave}
    onCancel={() => history.goBack()}
    onDelete={(!disabled && onDelete) ? onDelete : undefined}>

    {!card.id ? faq : null}

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
            <span className='flex-grow-1 text-end' style={{fontSize: '8pt', color: '#ccc'}}>card status: {card.status ?? 'no status'}</span>
          </FormSection>
          <AttendeeInfo className='me-3' attendee={flier} />
        </>
        : null
    }

    <FormSection>Rocket</FormSection>

    <div className='d-grid deck'>
      <FloatingInput {...textInputProps('rocket.name')}>
        <label>Rocket Name</label>
      </FloatingInput>

      <FloatingInput {...textInputProps('rocket.manufacturer')}>
        <label>Manufacturer</label>
      </FloatingInput>

      <FloatingInput {...textInputProps('rocket.length', true)} >
        <label>Length <span className='text-info ms-2'>(m)</span></label>
      </FloatingInput>

      <FloatingInput {...textInputProps('rocket.diameter', true)} >
        <label>Diameter <span className='text-info ms-2'>(m)</span></label>
      </FloatingInput>

      <FloatingInput {...textInputProps('rocket.mass', true)} >
        <label>Mass <span className='text-info ms-2' >(kg, incl. motor)</span></label>
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
      <FloatingInput {...textInputProps('motor.name')}>
        <label>Designation <span className='text-info ms-2'>(e.g. B6-5, J350)</span></label>
      </FloatingInput>

      <FloatingInput {...textInputProps('motor.impulse', true)} >
        <label>Impulse <span className='text-info ms-2'>(n-sec)</span></label>
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

    {/* <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      <Field disabled={disabled} label='Notes' as='textarea' rows='5' access={access('flight.notes')} />
    </Group> */}

  {/* Use floating labels once https://github.com/twbs/bootstrap/issues/32800 is fixed */}
  <div className='mt-3'>
    <label htmlFor='notes' className='form-label'>Notes</label>
    <textarea disabled={disabled} className='form-control' id='notes' rows={3} />
  </div>
  </Editor>;
}
