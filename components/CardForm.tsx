import { nanoid } from 'nanoid';
import React, { useEffect, useState } from 'react';
import { Col, Form } from 'react-bootstrap';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { db } from '../firebase';
import { iCard, iUser } from '../types';
import { useCurrentUser } from './App';
import { CertDot } from './CertDot';
import Editor from './Editor';
import { Loading, sortArray, tChildren, tProps } from './util';

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

function Field({ access, label, children, ...props }
  : {
    type ?: any,
    access : {getter : () => any, setter : (v) => void},
    label : string,
    children ?: tChildren
  } & tProps) {
  const { getter, setter } = access;

  const rId = Math.random().toString(16).substr(2);
  let input;
  if (props.type == 'switch') {
    const checked = getter();
    return <FieldCol>
      <Switch className='text-nowrap' id={rId} label={label} checked={checked} onChange={setter} />
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
    input = <Col><Control {...props} value={getter()} onChange={setter}>{children}</Control></Col>;
  }

  return <>
    <FieldCol><Label className='mt-2 mt-sm-0 mb-0'>{label}</Label></FieldCol>
    { input}
  </>;
}

export default function CardForm({ edit = false } : { edit ?: boolean}) {
  const history = useHistory();
  const [currentUser] = useCurrentUser();
  const match = useRouteMatch<{launchId : string, cardId : string}>();
  const { cardId, launchId } = match.params;
  const attendees = db.attendees.useValue(launchId);
  const fliers = attendees ? Object.values(attendees) : [];
  const dbCard = db.card.useValue(launchId, cardId);

  const [card, setCard] = useState<iCard>({
    id: nanoid(),
    launchId,
    userId: (currentUser as iUser).id
  });

  useEffect(() => {
    if (dbCard) setCard(dbCard);
  }, [dbCard]);

  if (cardId != 'create' && !card) return <Loading wat='Card' />;

  if (!currentUser) return <Loading wat='Current user' />;
  if (!attendees) return <Loading wat='Attendees' />;

  sortArray(fliers, 'name');

  const flier = fliers.find(f => f.id == card?.userId);

  function access(path : string, parser ?: (str : string) => number) {
    const parts : string[] = path.split('.');

    return {
      getter() : any {
        let o : any = card;
        for (const k of parts) o = o?.[k];
        if (typeof (o) === 'number') {
          o = Math.round(o * 1000) / 1000;
        }
        return o;
      },

      setter({ target }) {
        let value = target.type == 'checkbox' ? target.checked : target.value;

        if (parser) value = parser(value);

        const newCard : iCard = { ...card };
        let o = newCard;
        for (let i = 0; i < parts.length; i++) {
          if (i < parts.length - 1) {
            o = o[parts[i]] || {};
          } else {
            o[parts[i]] = value;
          }
        }

        setCard(newCard);
      }
    };
  }

  const onSave = async () => {
    card.launchId = launchId;
    card.userId = currentUser.id;
    await db.card.set(card.launchId, card.id, card);
    history.goBack();
  };

  const onDelete = card.id
    ? async () => {
      // TODO: Disallow deletion of cards that are racked, or that have been flown

      if (!confirm(`Delete the rocket named '${card.rocket?.name ?? '(unnamed rocket)'}'? (This cannot be undone!)`)) return;
      await db.card.remove(card.launchId, card.id);
      history.goBack();
    }
    : null;

  return <Editor
    onSave={onSave}
    onCancel={() => history.goBack()}
    onDelete={(edit && dbCard && onDelete) ? onDelete : undefined}>

    <details className='border border-info rounded px-2 mb-3'>
      <summary className='text-info'>{'\u24d8'} How do I specify units (e.g. length, mass, etc)...?</summary>

      <p className='mt-3'>
        Values are stored and displayed in <a rel='noreferrer' href='https://en.wikipedia.org/wiki/MKS_system_of_units' target='_blank'>MKS</a>  (meter, kilogram, second)  units.  Values may be entered in other units, as shown below, but will be converted to MKS.
      </p>

      <p>Note: Use the singular unit form. (E.g. "gm", not "gms").  Plural forms are not recognized.</p>

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
      <FieldCol><Label>Flier</Label></FieldCol>
      <Col>
        <Control as='select' value={flier?.id || ''}
          onChange={
            e => {
              const lu = attendees[e?.target.value];
              if (lu) {
                setCard({ ...card, userId: lu.id });
              }
            }
          }>
          <option value=''>Select Flier ...</option>
           {
             sortArray(Object.values(attendees), 'name')
               .map(lu => {
                 return <option key={lu.id} value={lu.id}>{lu.name}</option>;
               })
           }
        </Control>
      </Col>
      {flier ? <CertDot style={{ fontSize: '1.5rem' }} className='ml-3' cert={flier.cert} /> : null}
    </Group>

    <div className='mt-5 mb-3' style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
      <FormSection>Rocket</FormSection>
      <Col className={`border border-${card?.rsoId ? 'success' : 'warning'}`}>
        <Field type='switch' label='RSO Approved' access={access('flight.rsoVerified')} />
      </Col>
    </div>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      <Field label='Name' placeholder='Rocket name' access={access('rocket.name')} />
      <Field label='Manufacturer' access={access('rocket.manufacturer')} />
    </Group>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      <Field label='Length (m)' access={access('rocket.length')} />
      <Field label='Diameter (m)' access={access('rocket.diameter')} />
    </Group>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      <Field label='Mass w/ motor (kg)' access={access('rocket.mass')} />
      <Field label='Color' access={access('rocket.color')} />
    </Group>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      <Field type='radio(chute, streamer, dual-deploy, shovel )' label='Recovery' access={access('rocket.recovery')} />
    </Group>

    <FormSection>Motor</FormSection>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      <Field label='Motor' access={access('flight.motor')} />
      <Field label='Impulse (N⋅s)' access={access('flight.impulse')} />
    </Group>

    <FormSection>Flight</FormSection>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>

      <Col sm='2'/>
      <Field type='switch' label='1st Flight' access={access('flight.firstFlight')} />
      {/* @ts-expect-error `sm` att comes from react-bootstrap */}
      <Field sm='3' type='switch' label='Heads Up' access={access('flight.headsUp')} />
    </Group>

    <Group as={Row} className='align-items-center mb-0 mb-sm-3'>
      {/* @ts-expect-error `as` att comes from react-bootstrap */}
      <Field label='Notes' as='textarea' rows='5' access={access('flight.notes')} />
    </Group>
  </Editor>;
}
