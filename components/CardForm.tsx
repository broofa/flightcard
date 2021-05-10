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
  return <div className={`${className ?? ''}`}
    style={{
      fontSize: '1.2em',
      fontWeight: 'bold',
      color: '#ccc'
    }}
    {...props}>
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
      <Switch style={{ whiteSpace: 'nowrap' }} id={rId} label={label} checked={checked} onChange={setter} />
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

  function access(path : string) {
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
        const value = target.type == 'checkbox' ? target.checked : target.value;

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

    <Group as={Row} className='align-items-baseline mb-0 mb-sm-3'>
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
      <Col style={{ border: `solid 2px ${card?.rsoId ? 'green' : 'red'}` }}>
        <Field type='switch' label='RSO Approved' access={access('flight.rsoVerified')} />
      </Col>
    </div>

    <Group as={Row} className='align-items-baseline mb-0 mb-sm-3'>
      <Field label='Name' placeholder='Rocket name' access={access('rocket.name')} />
      <Field label='Manufacturer' access={access('rocket.manufacturer')} />
    </Group>

    <Group as={Row} className='align-items-baseline mb-0 mb-sm-3'>
      <Field label='Length (m)' access={access('rocket.length')} />
      <Field label='Diameter (m)' access={access('rocket.diameter')} />
    </Group>

    <Group as={Row} className='align-items-baseline mb-0 mb-sm-3'>
      <Field label='Mass (incl. motor)' access={access('rocket.mass')} />
      <Field label='Color' access={access('rocket.color')} />
    </Group>

    <Group as={Row} className='align-items-baseline mb-0 mb-sm-3'>
      <Field type='radio(chute, streamer, dual-deploy, shovel )' label='Recovery' access={access('rocket.recovery')} />
    </Group>

    <FormSection>Motor</FormSection>

    <Group as={Row} className='align-items-baseline mb-0 mb-sm-3'>
      <Field label='Motor' access={access('flight.motor')} />
      <Field label='Impulse (N⋅s)' access={access('flight.impulse')} />
    </Group>

    <FormSection>Flight</FormSection>

    <Group as={Row} className='align-items-baseline mb-0 mb-sm-3'>

      <Col sm='2'/>
      <Field type='switch' label='1st Flight' access={access('flight.firstFlight')} />
      {/* @ts-expect-error `sm` att comes from react-bootstrap */}
      <Field sm='3' type='switch' label='Heads Up' access={access('flight.headsUp')} />
    </Group>

    <Group as={Row} className='align-items-baseline mb-0 mb-sm-3'>
      {/* @ts-expect-error `as` att comes from react-bootstrap */}
      <Field label='Notes' as='textarea' rows='5' access={access('flight.notes')} />
    </Group>
  </Editor>;
}
