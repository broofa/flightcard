import { nanoid } from 'nanoid';
import React, { useEffect, useState } from 'react';
import { Col, Form } from 'react-bootstrap';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { db, DELETE } from '../firebase';
import { iCard, iUser } from '../types';
import { unitParse } from '../util/units';
import { APPNAME, useCurrentUser } from './App';
import Editor from './Editor';
import { errorTrap, showError } from './ErrorFlash';
import { AttendeeInfo } from './UserList';
import { Loading, tChildren, tProps } from './util';

const { Label, Control, Group, Row, Check, Switch } = Form;

function FormSection({ className, children, ...props }
  : { className ?: string, children : tChildren } & tProps) {
  return <div className={`text-muted h2 ${className ?? ''}`} {...props}>
    {children}
  </div>;
}

function FieldCol({ className, children, ...props }
  : { className ?: string, children : tChildren } & tProps) {
  return <Col sm='2' className={`mt-2 mt-sm-0 text-sm-right ${className ?? ''}`} {...props}>
    {children}
  </Col>;
}

function Field({ access, label, parser, children, ...props }
  : {
    access : {getter : () => any, setter : (v) => void},
    label : string,
    type ?: any,
    parser ?: (e : any) => void,
    children ?: tChildren,
    disabled ?: boolean
  } & tProps) {
  const { getter, setter } = access;

  const rId = Math.random().toString(16).substr(2);
  let input;

  function handleBlur(e) {
    if (parser) {
      const value = parser(e.target.value);
      setter({ target: { value } });
    }
  }

  if (props.type == 'switch') {
    const checked = getter();
    return <FieldCol>
      <Switch className='text-nowrap' id={rId} label={label} checked={checked} onChange={setter} {...props} />
    </FieldCol>;
  } else if (/^radio\((.*)\)$/.test(props.type)) {
  // Special case for type="radio(..list,of,radio,values...)"
    props.type = 'radio';
    const val = getter();
    input = RegExp.$1
      .split(/, */)
      .map((v, i) => <Col key={i}>
        <Check {...props} className='text-capitalize text-nowrap'
          id={rId + i} checked={val === v} label={v} value={v} onChange={setter} />
      </Col>);
  } else {
    input = <Col><Control onBlur={handleBlur} {...props} value={getter()} onChange={setter}>{children}</Control></Col>;
  }

  return <>
    <FieldCol><Label className='mt-2 mt-sm-0 mb-0'>{label}</Label></FieldCol>
    { input}
  </>;
}

export default function CardEditor({ edit = true } : { edit ?: boolean}) {
  const history = useHistory();
  const [currentUser] = useCurrentUser();
  const match = useRouteMatch<{launchId : string, cardId : string}>();
  const { cardId, launchId } = match.params;

  const [card, setCard] = useState<iCard>();
  const flier = db.attendee.useValue(launchId, card?.userId);

  useEffect(() => {
    if (cardId === 'create') {
      setCard({
        id: nanoid(),
        launchId,
        userId: (currentUser as iUser).id
      });
    } else {
      db.card.get(launchId, cardId).then(card => {
        setCard(card);
      });
    }
  }, [cardId]);

  if (!card) return <Loading wat='Card' />;

  if (!currentUser) return <Loading wat='Current user' />;

  const disabled = currentUser?.id !== flier?.id;

  function access(path : string) {
    return {
      getter() : any {
        const parts = path.split('.');
        let o : any = card;

        for (const k of parts) o = o?.[k];
        if (typeof (o) === 'number') {
          o = Math.round(o * 1000) / 1000;
        }
        return o;
      },

      setter({ target }) {
        const value = target.type == 'checkbox' ? target.checked : target.value;
        const newCard : iCard = { ...card } as iCard;
        const parts = path.split('.');
        const att = parts.pop();

        if (!att) return;

        let o = newCard;
        for (const part of parts) {
          if (!(part in o)) o[part] = {};
          o = o[part];
        }

        o[att] = value;

        setCard(newCard);
      }
    };
  }

  const onSave = async () => {
    if (!card) return;

    // validate
    try {
      if (card.userId != currentUser.id) throw Error('You are not allowed to edit someone else\'s card');

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
  };

  const onDelete = card?.id
    ? async () => {
      // TODO: Disallow deletion of cards that are racked, or that have been flown

      if (!confirm(`Delete the rocket named '${card.rocket?.name ?? '(unnamed rocket)'}'? (This cannot be undone!)`)) return;
      await db.card.remove(card.launchId, card.id);
      history.goBack();
    }
    : null;

  return <Editor
    onSave={disabled ? undefined : onSave}
    onCancel={() => history.goBack()}
    onDelete={(!disabled && edit && onDelete) ? onDelete : undefined}>

    <details className='border border-info rounded px-2 mb-3'>
      <summary className='text-info'>FAQ: How do I enter values with different units?</summary>

      <p className='mt-3'>
        {APPNAME} stores and displays all values in <a rel='noreferrer' href='https://en.wikipedia.org/wiki/MKS_system_of_units' target='_blank'>MKS</a>  (meter, kilogram, second)  units.  Values may be entered using other units as shown below, but will always be converted to MKS.
      </p>

      <p>Note: Always use the singular unit form. (E.g. "gm", not "gms").  Plural forms are not recognized.</p>

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '.2em 1em' }}>
        {/* Length */}
        <div className='font-weight-normal text-right'>Length (metric)</div>
        <div>
          <code>1m</code>, <code>1cm</code>, <code>1mm</code>
        </div>

        <div className='font-weight-normal text-right'>Length (imperial)</div>
        <div>
          <code>1ft</code>, <code>1'</code>, <code>1in</code>, <code>1"</code>, <code>1'1"</code>, <code>1ft 1in</code>
        </div>

        <div className='font-weight-normal text-right'>Mass (metric)</div>
        <div>
          <code>1kg</code>, <code>1gm</code>
        </div>

        <div className='font-weight-normal text-right'>Mass (imperial)</div>
        <div>
          <code>1lb</code>, <code>1oz</code> <code>1lb 1oz</code>
        </div>

        <div className='font-weight-normal text-right'>Thrust/force (metric)</div>
        <div><code>1n</code></div>

        <div className='font-weight-normal text-right'>Thrust/force (imperial)</div>
        <div><code>1lbf</code></div>

        <div className='font-weight-normal text-right'>Impulse (metric)</div>
        <div>
          <code>1n-s</code>,&ensp;
          <code>1n-sec</code>
        </div>

        <div className='font-weight-normal text-right'>Impulse (imperial)</div>
        <div>
          <code>1lbf-s</code>,&ensp;
          <code>1lbf-sec</code>
        </div>
      </dl>
    </details>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      <Col sm='2' className='text-muted text-nowrap h2'>Flier</Col>
      <Col className='d-flex'>
        {flier ? <AttendeeInfo className='h2 flex-grow-1' attendee={flier} /> : null}
      </Col>
    </Group>

    <div className='mt-2 mb-3' style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
      <FormSection>Rocket</FormSection>
      <Col className={`border border-${card?.rsoId ? 'success' : 'warning'}`}>
        <Field disabled={disabled} type='switch' label='RSO Approved' access={access('flight.rsoVerified')} />
      </Col>
    </div>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      <Field disabled={disabled} label='Name' placeholder='Rocket name' access={access('rocket.name')} />
      <Field disabled={disabled} label='Manufacturer' access={access('rocket.manufacturer')} />
    </Group>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      <Field disabled={disabled} label='Length (m)' access={access('rocket.length')} parser={unitParse} />
      <Field disabled={disabled} label='Diameter (m)' access={access('rocket.diameter')} parser={unitParse} />
    </Group>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      <Field disabled={disabled} label='Mass w/ motor (kg)' access={access('rocket.mass')} parser={unitParse} />
      <Field disabled={disabled} label='Color' access={access('rocket.color')} />
    </Group>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      <Field disabled={disabled} type='radio(chute, streamer, dual-deploy, shovel )' label='Recovery' access={access('rocket.recovery')} />
    </Group>

    <FormSection>Motor</FormSection>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      <Field disabled={disabled} label='Motor' access={access('motor.name')} />
      <Field disabled={disabled} label='Impulse (N⋅s)' access={access('motor.impulse')} parser={unitParse} />
    </Group>

    <FormSection>Flight</FormSection>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>

      <Col sm='2'/>
      <Field disabled={disabled} type='switch' label='1st Flight' access={access('flight.firstFlight')} />
      {/* @ts-expect-error `sm` att comes from react-bootstrap */}
      <Field disabled={disabled} sm='3' type='switch' label='Heads Up' access={access('flight.headsUp')} />
      {/* @ts-expect-error `sm` att comes from react-bootstrap */}
      <Field disabled={disabled} sm='3' type='switch' label='Complex' access={access('flight.complex')} />
    </Group>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      {/* @ts-expect-error `as` att comes from react-bootstrap */}
      <Field disabled={disabled} label='Notes' as='textarea' rows='5' access={access('flight.notes')} />
    </Group>
  </Editor>;
}
